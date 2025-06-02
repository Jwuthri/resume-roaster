import { NextRequest, NextResponse } from 'next/server'
import { callOpenAIBatchAnswerEvaluation, OPENAI_MODELS } from '@/lib/openai-utils'
import { db, UserService } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { questions, userAnswers, roastId } = await request.json()

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Questions array is required' },
        { status: 400 }
      )
    }

    if (!userAnswers || typeof userAnswers !== 'object') {
      return NextResponse.json(
        { error: 'User answers object is required' },
        { status: 400 }
      )
    }

    // Check if user can afford this model (only for authenticated users)
    const userId = session?.user?.id;
    if (userId) {
      const modelToUse = OPENAI_MODELS.MINI; // Using MINI model for comprehensive evaluation
      const affordability = await UserService.checkModelAffordability(userId, modelToUse);
      if (!affordability.canAfford) {
        return NextResponse.json(
          { 
            error: `Insufficient credits. Session evaluation costs ${affordability.creditCost} credits, but you only have ${affordability.remaining} credits remaining.`,
            creditCost: affordability.creditCost,
            remaining: affordability.remaining,
            tier: affordability.tier
          },
          { status: 402 } // Payment Required
        );
      }
    }

    // Filter questions that have user answers
    const answeredQuestions = questions.filter(q => 
      userAnswers[q.id] && userAnswers[q.id].trim().length > 0
    )

    if (answeredQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No answered questions found' },
        { status: 400 }
      )
    }

    // Create comprehensive evaluation prompt
    const evaluationPrompt = `Please evaluate this complete interview practice session:

PRACTICE SESSION OVERVIEW:
- Total Questions: ${answeredQuestions.length}
- Question Categories: ${[...new Set(answeredQuestions.map(q => q.category))].join(', ')}
- Difficulty Levels: ${[...new Set(answeredQuestions.map(q => q.difficulty))].join(', ')}

QUESTIONS AND ANSWERS:
${answeredQuestions.map((question, index) => `
QUESTION ${index + 1} [${question.category.toUpperCase()} - ${question.difficulty}]:
${question.question}

USER'S ANSWER:
${userAnswers[question.id]}

SUGGESTED ANSWER (for reference):
${question.suggestedAnswer}

TIPS:
${question.tips.map((tip: string, tipIndex: number) => `${tipIndex + 1}. ${tip}`).join('\n')}
`).join('\n---\n')}

EVALUATION INSTRUCTIONS:
- Provide an overall session score (0-100)
- Evaluate each question individually with scores and brief feedback
- Identify the candidate's strongest areas across all answers
- Highlight the most critical areas for improvement
- Provide specific, actionable next steps for continued practice
- Give encouraging overall feedback that motivates continued improvement

Focus on patterns across all answers and provide insights that help the candidate understand their interview readiness.`

    // Call OpenAI for comprehensive evaluation
    const response = await callOpenAIBatchAnswerEvaluation(evaluationPrompt)

    // Deduct credits for successful AI usage (only for authenticated users)
    if (userId) {
      try {
        const modelToUse = OPENAI_MODELS.MINI;
        await UserService.deductModelCredits(userId, modelToUse);
        console.log(`Successfully deducted 4 credits for session evaluation`);
      } catch (creditError) {
        console.error('Failed to deduct credits:', creditError);
        // Log error but don't fail the request since AI call succeeded
      }
    }

    // Save evaluation to database if analysisId is provided
    let savedEvaluationId = null
    if (roastId) {
      try {
        // First find the GeneratedInterviewPrep record for this roastId
        const interviewPrep = await db.generatedInterviewPrep.findFirst({
          where: {
            roastId: roastId,
            ...(session?.user?.id ? { userId: session.user.id } : {})
          }
        })

        if (interviewPrep) {
          // Create evaluation record
          const evaluation = await db.interviewEvaluation.create({
            data: {
              interviewPrepId: interviewPrep.id,
              userId: session?.user?.id || null,
              evaluationType: 'session',
              data: response.data as any,
              questionsCount: answeredQuestions.length,
              overallScore: response.data.overallScore || 0
            }
          })
          savedEvaluationId = evaluation.id
        }
      } catch (dbError) {
        console.error('Error saving evaluation to database:', dbError)
        // Continue without saving to DB
      }
    }

    return NextResponse.json({
      evaluation: response.data,
      questionsEvaluated: answeredQuestions.length,
      processingTime: response.processingTime,
      cost: response.cost,
      id: savedEvaluationId,
      ...(userId && { creditsDeducted: 4 })
    })

  } catch (error) {
    console.error('Error evaluating practice session:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate practice session' },
      { status: 500 }
    )
  }
}