import { NextRequest, NextResponse } from 'next/server'
import { callOpenAIAnswerEvaluation, OPENAI_MODELS } from '@/lib/openai-utils'
import { db, UserService } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { userAnswer, question, suggestedAnswer, tips, category, difficulty, analysisId, questionId } = await request.json()

    if (!userAnswer || !question || !suggestedAnswer) {
      return NextResponse.json(
        { error: 'User answer, question, and suggested answer are required' },
        { status: 400 }
      )
    }

    // Check if user can afford this model (only for authenticated users)
    const userId = session?.user?.id;
    if (userId) {
      const modelToUse = OPENAI_MODELS.NANO; // Using NANO model for individual answer evaluation
      const affordability = await UserService.checkModelAffordability(userId, modelToUse);
      if (!affordability.canAfford) {
        return NextResponse.json(
          { 
            error: `Insufficient credits. Answer evaluation costs ${affordability.creditCost} credit, but you only have ${affordability.remaining} credits remaining.`,
            creditCost: affordability.creditCost,
            remaining: affordability.remaining,
            tier: affordability.tier
          },
          { status: 402 } // Payment Required
        );
      }
    }

    // Create evaluation prompt
    const evaluationPrompt = `Please evaluate this interview answer:

INTERVIEW QUESTION:
${question}

QUESTION CATEGORY: ${category || 'general'}
DIFFICULTY LEVEL: ${difficulty || 'medium'}

USER'S ANSWER:
${userAnswer}

SUGGESTED ANSWER (for reference):
${suggestedAnswer}

${tips && tips.length > 0 ? `TIPS TO CONSIDER:
${tips.map((tip: string, index: number) => `${index + 1}. ${tip}`).join('\n')}` : ''}

EVALUATION CRITERIA:
- Content quality and relevance to the question
- Structure and clarity of the response
- Use of specific examples or details
- Alignment with best practices for this type of question
- Areas for improvement

IMPORTANT: Keep feedback concise and actionable:
- Provide 2-3 strengths maximum
- Identify only the 2-3 most critical areas for improvement
- List only the 2-3 most important missing key points
- Give only the 2-3 most actionable suggestions
- Keep overall feedback to 1-2 sentences

Focus on the most impactful feedback that will help the user improve their interview skills.`

    // Call OpenAI Nano for fast evaluation
    const response = await callOpenAIAnswerEvaluation(evaluationPrompt)

    // Deduct credits for successful AI usage (only for authenticated users)
    if (userId) {
      try {
        const modelToUse = OPENAI_MODELS.NANO;
        await UserService.deductModelCredits(userId, modelToUse);
        console.log(`Successfully deducted 1 credit for answer evaluation`);
      } catch (creditError) {
        console.error('Failed to deduct credits:', creditError);
        // Log error but don't fail the request since AI call succeeded
      }
    }

    // Save individual evaluation to database if analysisId is provided
    let savedEvaluationId = null
    if (analysisId && questionId) {
      try {
        // First find the InterviewPrep record for this analysisId
        const interviewPrep = await db.interviewPrep.findFirst({
          where: {
            analysisId: analysisId,
            ...(session?.user?.id ? { userId: session.user.id } : {})
          }
        })

        if (interviewPrep) {
          const evaluationData = {
            ...response.data,
            questionId,
            question,
            userAnswer,
            category,
            difficulty
          }

          const savedEvaluation = await db.interviewEvaluation.create({
            data: {
              interviewPrepId: interviewPrep.id,
              userId: session?.user?.id || null,
              evaluationType: 'individual',
              data: evaluationData as any,
              questionsCount: 1,
              overallScore: response.data.score || 0
            }
          })
          savedEvaluationId = savedEvaluation.id
        }
      } catch (dbError) {
        console.error('Error saving individual evaluation to database:', dbError)
        // Continue without saving to DB
      }
    }

    return NextResponse.json({
      evaluation: response.data,
      processingTime: response.processingTime,
      cost: response.cost,
      id: savedEvaluationId,
      ...(userId && { creditsDeducted: 1 })
    })

  } catch (error) {
    console.error('Error evaluating answer:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    )
  }
} 