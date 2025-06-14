import OpenAI from 'openai'
import { parseJSONResponse, isContentIncomplete } from '@/lib/json-utils'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Default model constants
export const OPENAI_MODELS = {
  NANO: 'gpt-4.1-nano',
  MINI: 'gpt-4.1-mini',
  NORMAL: 'gpt-4.1',
  LARGE: 'o4-mini-high'
} as const

// Default context size constants
export const CONTEXT_SIZES = {
  MINI: 1000,
  NORMAL: 4000,
  LARGE: 8000,
  XLARGE: 40000
} as const

// Default temperature constants
export const TEMPERATURES = {
  DETERMINISTIC: 0,
  LOW: 0.1,
  NORMAL: 0.3,
  HIGH: 0.7,
  CREATIVE: 1.0
} as const

export interface OpenAICallOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
  enforceJSON?: boolean
  systemPrompt?: string
  retryOnIncomplete?: boolean
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[]
  toolChoice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption
}

export interface OpenAIResponse<T = any> {
  data: T
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  processingTime: number
  finishReason: string
  usedContinuation?: boolean
}

export interface OpenAIError extends Error {
  code?: string
  status?: number
  type?: string
}

// Default options (excluding optional tool properties)
const DEFAULT_OPTIONS = {
  model: OPENAI_MODELS.MINI,
  maxTokens: CONTEXT_SIZES.NORMAL,
  temperature: TEMPERATURES.NORMAL,
  timeout: 800000, // 800 seconds - maximum allowed on Pro plan
  enforceJSON: false,
  systemPrompt: '',
  retryOnIncomplete: true
} as const

// Pricing per 1K tokens (input/output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  [OPENAI_MODELS.MINI]: { input: 0.00015, output: 0.0006 },
  [OPENAI_MODELS.NANO]: { input: 0.00015, output: 0.0006 },
  [OPENAI_MODELS.NORMAL]: { input: 0.005, output: 0.015 },
  [OPENAI_MODELS.LARGE]: { input: 0.03, output: 0.06 }
}

/**
 * Get pricing for a model (with fallback for legacy model names)
 */
function getModelPricing(model: string): { input: number; output: number } {
  // Check if it's already in our pricing table
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model]
  }
  
  // Handle legacy model names
  const legacyMapping: Record<string, string> = {
    'gpt-4.1-nano': OPENAI_MODELS.NANO,
    'gpt-4.1-mini': OPENAI_MODELS.MINI,
    'gpt-4.1': OPENAI_MODELS.NORMAL,
    'o4-mini-high': OPENAI_MODELS.LARGE
  }
  
  const mappedModel = legacyMapping[model]
  if (mappedModel && MODEL_PRICING[mappedModel]) {
    return MODEL_PRICING[mappedModel]
  }
  
  // Default fallback
  return MODEL_PRICING[OPENAI_MODELS.MINI]
}

/**
 * Calculate cost based on token usage and model
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = getModelPricing(model)
  return (promptTokens * pricing.input + completionTokens * pricing.output) / 1000
}

/**
 * Main OpenAI API call function with JSON enforcement and error handling
 */
export async function callOpenAI<T = any>(
  userPrompt: string,
  options: OpenAICallOptions = {}
): Promise<OpenAIResponse<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()

  console.log('🚀 Starting OpenAI API call...')
  console.log('Model:', opts.model)
  console.log('Max tokens:', opts.maxTokens)
  console.log('Temperature:', opts.temperature)
  console.log('Enforce JSON:', opts.enforceJSON)
  console.log('Prompt length:', userPrompt.length)

  try {
    // Prepare messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
    
    if (opts.systemPrompt) {
      messages.push({
        role: 'system',
        content: opts.systemPrompt
      })
    }
    
    messages.push({
      role: 'user',
      content: userPrompt
    })

    // Prepare request options
    const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: opts.model,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }

    // Add JSON format enforcement if requested (and no tools)
    if (opts.enforceJSON && !opts.tools) {
      requestOptions.response_format = { type: 'json_object' }
    }

    // Add tools if provided
    if (opts.tools && opts.tools.length > 0) {
      requestOptions.tools = opts.tools
      if (opts.toolChoice) {
        requestOptions.tool_choice = opts.toolChoice
      }
    }

    // Make the API call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout)

    let completion: OpenAI.Chat.Completions.ChatCompletion
    try {
      completion = await openai.chat.completions.create(requestOptions)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${opts.timeout / 1000} seconds`)
      }
      throw error
    }

    clearTimeout(timeoutId)
    const apiCallTime = Date.now() - startTime
    console.log(`✅ OpenAI API call completed in ${apiCallTime}ms`)

    const message = completion.choices[0]?.message
    if (!message) {
      throw new Error('No message generated')
    }

    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    const cost = calculateCost(opts.model, usage.prompt_tokens, usage.completion_tokens)
    const finishReason = completion.choices[0]?.finish_reason || 'stop'

    let parsedData: T
    let finalContent = ''
    let usedContinuation = false

    // Handle function calling response
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('✅ Function call response received')
      const toolCall = message.tool_calls[0]
      console.log('🔧 Function name:', toolCall.function?.name)
      if (toolCall.function?.arguments) {
        try {
          parsedData = JSON.parse(toolCall.function.arguments) as T
          finalContent = toolCall.function.arguments
          console.log('✅ Function call arguments parsed successfully')
        } catch (parseError) {
          console.error('❌ Failed to parse function call arguments:', parseError)
          console.error('Raw arguments:', toolCall.function.arguments)
          
          // Try to fix common JSON issues
          let fixedArguments = toolCall.function.arguments
          
          // Remove trailing commas
          fixedArguments = fixedArguments.replace(/,(\s*[}\]])/g, '$1')
          
          // Fix unescaped quotes in strings
          fixedArguments = fixedArguments.replace(/([^\\])"/g, '$1\\"')
          
          // Try parsing the fixed version
          try {
            parsedData = JSON.parse(fixedArguments) as T
            finalContent = fixedArguments
            console.log('✅ Function call arguments parsed successfully after fixing')
          } catch (secondParseError) {
            console.error('❌ Failed to parse even after fixing:', secondParseError)
            
            // Return a fallback response for evaluation functions
            if (toolCall.function.name === 'evaluate_interview_answer') {
              console.log('🔄 Using fallback evaluation response')
              parsedData = {
                score: 70,
                strengths: ['Answer provided shows effort and thought'],
                improvements: ['Could be more specific with examples', 'Structure could be clearer'],
                missingElements: ['Consider adding more concrete details'],
                followUpSuggestions: ['Practice with the STAR method', 'Include quantifiable results'],
                overallFeedback: 'Good attempt! Focus on being more specific and structured in your response.'
              } as T
              finalContent = JSON.stringify(parsedData)
            } else {
              throw new Error('Failed to parse function call response')
            }
          }
        }
      } else {
        throw new Error('No function arguments in tool call')
      }
    } else {
      // Handle regular content response
      const content = message.content
      if (!content) {
        throw new Error('No content generated')
      }
      finalContent = content

      // Handle JSON parsing if enforced
      if (opts.enforceJSON) {
        try {
          parsedData = JSON.parse(content) as T
          console.log('✅ JSON parsing successful')
        } catch (parseError) {
          console.error('❌ JSON parsing failed despite enforcement:', parseError)
          throw new Error('Failed to parse JSON response despite enforcement')
        }
      } else {
        // Try to parse as JSON if it looks like JSON, otherwise return as string
        // First check if content contains at least one '{' - if not, it's definitely not JSON
        if (!content.includes('{')) {
          console.log('✅ No JSON braces found, returning as plain text')
          parsedData = content as T
        } else {
          try {
            parsedData = parseJSONResponse(content) as T
            console.log('✅ JSON parsing successful')
          } catch (parseError) {
            // Check if content appears incomplete and retry with continuation
            if (opts.retryOnIncomplete && isContentIncomplete(content)) {
              console.log('🔄 Content appears incomplete, attempting continuation...')
              
              try {
                const continuationMessages = [
                  ...messages,
                  { role: 'assistant' as const, content },
                  { role: 'user' as const, content: 'Continue please. Complete the JSON response from where you left off.' }
                ]

                const continuationCompletion = await openai.chat.completions.create({
                  model: opts.model,
                  messages: continuationMessages,
                  max_tokens: Math.min(opts.maxTokens, 20000),
                  temperature: opts.temperature,
                  ...(opts.enforceJSON ? { response_format: { type: 'json_object' as const } } : {})
                })

                const continuationContent = continuationCompletion.choices[0]?.message?.content || ''
                finalContent = content + continuationContent
                usedContinuation = true

                // Update usage and cost
                const continuationUsage = continuationCompletion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
                usage.prompt_tokens += continuationUsage.prompt_tokens
                usage.completion_tokens += continuationUsage.completion_tokens
                usage.total_tokens += continuationUsage.total_tokens

                console.log('🔗 Continuation completed, attempting to parse combined content...')
                
                if (opts.enforceJSON) {
                  parsedData = JSON.parse(finalContent) as T
                } else {
                  parsedData = parseJSONResponse(finalContent) as T
                }
                
                console.log('✅ JSON parsing successful after continuation')
              } catch (continuationError) {
                console.error('❌ Continuation failed:', continuationError)
                throw new Error('Failed to complete response even with continuation')
              }
            } else {
              // Return content as string if not JSON
              parsedData = content as T
            }
          }
        }
      }
    }

    const processingTime = Date.now() - startTime
    const finalCost = calculateCost(opts.model, usage.prompt_tokens, usage.completion_tokens)

    console.log('📊 OpenAI call completed successfully')
    console.log('Processing time:', processingTime, 'ms')
    console.log('Tokens used:', usage.total_tokens)
    console.log('Cost:', finalCost)
    console.log('Used continuation:', usedContinuation)

    return {
      data: parsedData,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      cost: finalCost,
      processingTime,
      finishReason,
      usedContinuation
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error('❌ OpenAI API call failed:', error)
    
    // Create a more informative error
    const openaiError: OpenAIError = new Error(error.message || 'OpenAI API call failed')
    openaiError.code = error.code
    openaiError.status = error.status
    openaiError.type = error.type
    openaiError.name = 'OpenAIError'
    
    throw openaiError
  }
}

/**
 * Convenience function for JSON-enforced calls
 */
export async function callOpenAIJSON<T = any>(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'enforceJSON'> = {}
): Promise<OpenAIResponse<T>> {
  return callOpenAI<T>(userPrompt, { ...options, enforceJSON: true })
}

/**
 * Convenience function for text generation
 */
export async function callOpenAIText(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'enforceJSON'> = {}
): Promise<OpenAIResponse<string>> {
  return callOpenAI<string>(userPrompt, { ...options, enforceJSON: false })
}

/**
 * Helper function for resume optimization with function calling
 * Enhanced to better integrate certifications, training, and publications
 * Now includes scoring and analysis similar to callOpenAIResumeAnalysis
 */
export async function callOpenAIResumeOptimization(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'optimize_resume_data',
        description: 'Optimizes resume data for ATS systems and job requirements while maintaining truthfulness. Strategically integrates certifications, training, and publications to maximize impact and relevance to the target role. Also provides scoring and analysis.',
        parameters: {
          type: 'object',
          properties: {
            optimizedData: {
              type: 'object',
              description: 'The optimized resume data',
              properties: {
                personalInfo: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    location: { type: 'string' },
                    linkedin: { type: 'string' },
                    website: { type: 'string' },
                    jobTitle: { type: 'string' },
                    jobDescription: { type: 'string' },
                  },
                  required: ['name']
                },
                summary: { 
                  type: 'string',
                  description: 'Professional summary that highlights key certifications and training when relevant to the target role'
                },
                experience: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      company: { type: 'string' },
                      startDate: { type: 'string' },
                      endDate: { type: 'string' },
                      location: { type: 'string' },
                      achievements: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Quantified achievements that may reference relevant certifications or training applied'
                      },
                      description: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Role descriptions that can mention certifications or training when directly relevant to responsibilities'
                      }
                    },
                    required: ['title', 'company', 'startDate', 'endDate']
                  }
                },
                education: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      degree: { type: 'string' },
                      school: { type: 'string' },
                      graduationDate: { type: 'string' },
                      gpa: { type: 'string' },
                      location: { type: 'string' },
                      honors: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      relevantCoursework: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Relevant coursework, especially if it relates to certifications or specialized training'
                      }
                    },
                    required: ['degree', 'school']
                  }
                },
                skills: {
                  type: 'object',
                  properties: {
                    technical: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Technical skills, prioritizing those backed by certifications or formal training'
                    },
                    soft: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    languages: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Languages with proficiency levels, including any language certifications'
                    },
                    tools: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Software tools and platforms, especially those with certifications'
                    }
                  }
                },
                certifications: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      issuer: { type: 'string' },
                      date: { type: 'string' },
                      expirationDate: { type: 'string' },
                      credentialId: { type: 'string' },
                      url: { type: 'string' },
                      relevanceScore: {
                        type: 'number',
                        description: 'Score 1-10 indicating relevance to target role for prioritization'
                      },
                      description: {
                        type: 'string',
                        description: 'Brief description of certification value and skills gained'
                      }
                    },
                    required: ['name', 'issuer'],
                    description: 'Professional certifications prioritized by relevance to target role'
                  }
                },
                training: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      provider: { type: 'string' },
                      completionDate: { 
                        type: 'string',
                        description: 'Date when the training was completed'
                      },
                      expirationDate: { 
                        type: 'string',
                        description: 'Date when the certification expires (if applicable)'
                      },
                      credentialId: { 
                        type: 'string',
                        description: 'Credential or certificate ID'
                      },
                      link: { 
                        type: 'string',
                        description: 'URL to verify the certification'
                      },
                      duration: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: ['workshop', 'bootcamp', 'course', 'seminar', 'conference', 'online_course', 'corporate_training', 'certification'],
                        description: 'Type of training program'
                      },
                      skills: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Key skills or technologies learned'
                      },
                      relevanceScore: {
                        type: 'number',
                        description: 'Score 1-10 indicating relevance to target role for prioritization'
                      },
                      description: {
                        type: 'string',
                        description: 'Brief description of training content and outcomes'
                      }
                    },
                    required: ['name', 'provider', 'completionDate'],
                    description: 'Professional training and development programs, prioritized by relevance'
                  }
                },
                publications: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      authors: { 
                        type: 'string',
                        description: 'Authors as a string (e.g., "Smith, J., Doe, A., Johnson, M.")'
                      },
                      journal: { 
                        type: 'string',
                        description: 'Journal name if published in a journal'
                      },
                      conference: { 
                        type: 'string',
                        description: 'Conference name if published in a conference'
                      },
                      year: { 
                        type: 'string',
                        description: 'Publication year'
                      },
                      doi: { 
                        type: 'string',
                        description: 'Digital Object Identifier'
                      },
                      link: { 
                        type: 'string',
                        description: 'URL to the publication'
                      },
                      type: {
                        type: 'string',
                        enum: ['journal_article', 'conference_paper', 'book_chapter', 'white_paper', 'blog_post', 'technical_report'],
                        description: 'Type of publication'
                      },
                      relevanceScore: {
                        type: 'number',
                        description: 'Score 1-10 indicating relevance to target role for prioritization'
                      },
                      description: {
                        type: 'string',
                        description: 'Brief description of publication topic and its relevance to the field'
                      }
                    },
                    required: ['title', 'authors', 'year'],
                    description: 'Academic and professional publications, prioritized by relevance to target role'
                  }
                },
                projects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      technologies: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      url: { type: 'string' },
                      startDate: { type: 'string' },
                      endDate: { type: 'string' },
                      role: { type: 'string' },
                      achievements: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Quantified project outcomes and impact'
                      },
                      certificationsBased: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Certifications or training that enabled this project'
                      }
                    },
                    required: ['name', 'description']
                  }
                },
                additionalSections: {
                  type: 'object',
                  properties: {
                    awards: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          issuer: { type: 'string' },
                          date: { type: 'string' },
                          description: { type: 'string' }
                        }
                      }
                    },
                    volunteerWork: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          organization: { type: 'string' },
                          role: { type: 'string' },
                          startDate: { type: 'string' },
                          endDate: { type: 'string' },
                          description: { type: 'string' },
                          skills: {
                            type: 'array',
                            items: { type: 'string' }
                          }
                        }
                      }
                    },
                    professionalMemberships: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          organization: { type: 'string' },
                          membershipType: { type: 'string' },
                          startDate: { type: 'string' },
                          endDate: { type: 'string' }
                        }
                      }
                    }
                  },
                  description: 'Additional sections that may be relevant based on the target role'
                }
              },
              required: ['personalInfo']
            },
            scoring: {
              type: 'object',
              description: 'Scoring analysis of the optimized resume',
              properties: {
                overallScore: {
                  type: 'number',
                  description: 'Overall score from 0-100 based on resume quality and job match',
                  minimum: 0,
                  maximum: 100
                },
                scoringBreakdown: {
                  type: 'object',
                  properties: {
                    skills: {
                      type: 'number',
                      description: 'Skills match score out of 40 points',
                      minimum: 0,
                      maximum: 40
                    },
                    experience: {
                      type: 'number',
                      description: 'Experience relevance score out of 35 points',
                      minimum: 0,
                      maximum: 35
                    },
                    achievements: {
                      type: 'number',
                      description: 'Achievement alignment score out of 20 points',
                      minimum: 0,
                      maximum: 20
                    },
                    presentation: {
                      type: 'number',
                      description: 'Presentation quality score out of 5 points',
                      minimum: 0,
                      maximum: 5
                    }
                  },
                  required: ['skills', 'experience', 'achievements', 'presentation']
                },
                scoreLabel: {
                  type: 'string',
                  enum: ['Exceptional Match', 'Strong Match', 'Good Match', 'Fair Match', 'Weak Match', 'Poor Match'],
                  description: 'Label describing the overall score level'
                },
                keywordMatch: {
                  type: 'object',
                  properties: {
                    matched: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Keywords found in both resume and job description'
                    },
                    missing: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Important keywords missing from resume'
                    },
                    matchPercentage: {
                      type: 'number',
                      description: 'Percentage of important keywords matched',
                      minimum: 0,
                      maximum: 100
                    }
                  },
                  required: ['matched', 'missing', 'matchPercentage']
                },
                atsIssues: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of ATS compatibility issues found'
                }
              },
              required: ['overallScore', 'scoringBreakdown', 'scoreLabel', 'keywordMatch', 'atsIssues']
            },
            improvements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key improvements made during optimization'
            }
          },
          required: ['optimizedData', 'scoring']
        }
      }
    }
  ]

  return callOpenAI(userPrompt, {
    ...options,
    tools,
    toolChoice: { type: 'function', function: { name: 'optimize_resume_data' } }
  })
}

/**
 * Helper function for job description summarization with function calling
 */
export async function callOpenAIJobSummary(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'summarize_job_description',
        description: 'Analyzes and summarizes a job description, extracting key information',
        parameters: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'A concise 2-3 paragraph summary of the role, responsibilities, and company (max 500 words)'
            },
            keyRequirements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Essential skills and qualifications required for the role'
            },
            companyName: {
              type: 'string',
              description: 'Company name if mentioned in the job description'
            },
            jobTitle: {
              type: 'string',
              description: 'Job title or position name'
            },
            location: {
              type: 'string',
              description: 'Job location if mentioned'
            },
            salaryRange: {
              type: 'string',
              description: 'Salary range if mentioned'
            }
          },
          required: ['summary', 'keyRequirements']
        }
      }
    }
  ]

  return callOpenAI(userPrompt, {
    ...options,
    tools,
    toolChoice: { type: 'function', function: { name: 'summarize_job_description' } }
  })
}

/**
 * Helper function for PDF extraction with function calling
 */
export async function callOpenAIPDFExtraction(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'extract_resume_content',
        description: 'Extracts and formats resume content from PDF as clean, professional markdown',
        parameters: {
          type: 'object',
          properties: {
            markdown: {
              type: 'string',
              description: 'The extracted content formatted as clean markdown'
            },
            summary: {
              type: 'string',
              description: 'A brief summary of the resume content'
            },
            sections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of main sections found in the resume'
            }
          },
          required: ['markdown', 'summary', 'sections']
        }
      }
    }
  ]

  return callOpenAI(userPrompt, {
    ...options,
    tools,
    toolChoice: { type: 'function', function: { name: 'extract_resume_content' } }
  })
}

/**
 * Generate interview preparation using OpenAI with structured tool output
 */
export async function callOpenAIInterviewPrep(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'generate_interview_prep',
        description: 'Generate personalized interview questions and preparation materials',
        parameters: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  question: { type: 'string' },
                  category: { 
                    type: 'string',
                    enum: ['behavioral', 'technical', 'situational', 'general']
                  },
                  difficulty: { 
                    type: 'string',
                    enum: ['easy', 'medium', 'hard']
                  },
                  suggestedAnswer: { type: 'string' },
                  tips: { 
                    type: 'array',
                    items: { type: 'string' }
                  },
                  followUpQuestions: { 
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['id', 'question', 'category', 'difficulty', 'suggestedAnswer', 'tips']
              }
            },
            overallTips: {
              type: 'array',
              items: { type: 'string' }
            },
            companyResearch: {
              type: 'array',
              items: { type: 'string' }
            },
            salaryNegotiation: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['questions', 'overallTips']
        }
      }
    }
  ]

  return callOpenAI(userPrompt, {
    ...options,
    tools,
    toolChoice: { type: 'function', function: { name: 'generate_interview_prep' } }
  })
}

/**
 * Evaluate user's interview answer using OpenAI Nano for fast feedback
 */
export async function callOpenAIAnswerEvaluation(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'evaluate_interview_answer',
        description: 'Evaluate a user\'s interview answer against the suggested answer and tips',
        parameters: {
          type: 'object',
          properties: {
            score: {
              type: 'integer',
              description: 'Overall score from 0-100 based on answer quality',
              minimum: 0,
              maximum: 100
            },
            strengths: {
              type: 'array',
              items: { 
                type: 'string',
                maxLength: 100
              },
              description: 'What the user did well in their answer (2-3 items max)',
              maxItems: 3,
              minItems: 1
            },
            improvements: {
              type: 'array',
              items: { 
                type: 'string',
                maxLength: 100
              },
              description: 'Specific areas where the user can improve their answer (2-3 items max)',
              maxItems: 3,
              minItems: 1
            },
            missingElements: {
              type: 'array',
              items: { 
                type: 'string',
                maxLength: 100
              },
              description: 'Key points from the suggested answer that the user missed (2-3 items max)',
              maxItems: 3,
              minItems: 0
            },
            followUpSuggestions: {
              type: 'array',
              items: { 
                type: 'string',
                maxLength: 100
              },
              description: 'Specific suggestions for how to improve this answer (2-3 items max)',
              maxItems: 3,
              minItems: 1
            },
            overallFeedback: {
              type: 'string',
              description: 'Brief overall assessment and encouragement (1-2 sentences)',
              maxLength: 200
            }
          },
          required: ['score', 'strengths', 'improvements', 'followUpSuggestions', 'overallFeedback']
        }
      }
    }
  ]

  return callOpenAI(userPrompt, {
    ...options,
    model: OPENAI_MODELS.NANO, // Use fast Nano model for quick evaluation
    maxTokens: CONTEXT_SIZES.MINI, // Keep it concise
    temperature: TEMPERATURES.LOW, // More consistent evaluation
    tools,
    toolChoice: { type: 'function', function: { name: 'evaluate_interview_answer' } }
  })
}

/**
 * Evaluate multiple interview answers at once for comprehensive practice session review
 */
export async function callOpenAIBatchAnswerEvaluation(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const batchEvaluationTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: 'function',
    function: {
      name: 'evaluate_interview_answers',
      description: 'Evaluate multiple interview answers and provide comprehensive feedback',
      parameters: {
        type: 'object',
        properties: {
          overallScore: {
            type: 'number',
            description: 'Overall interview performance score (0-100)',
            minimum: 0,
            maximum: 100
          },
          questionEvaluations: {
            type: 'array',
            description: 'Individual evaluations for each question',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string', description: 'ID of the question' },
                score: { 
                  type: 'number', 
                  description: 'Score for this answer (0-100)',
                  minimum: 0,
                  maximum: 100
                },
                feedback: { type: 'string', description: 'Detailed feedback for this answer' },
                strengths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Strengths in this answer'
                },
                improvements: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Areas for improvement'
                }
              },
              required: ['questionId', 'score', 'feedback', 'strengths', 'improvements']
            }
          },
          sessionSummary: {
            type: 'object',
            description: 'Overall session summary and recommendations',
            properties: {
              overallFeedback: { type: 'string', description: 'General feedback on performance' },
              keyStrengths: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key strengths demonstrated'
              },
              areasForImprovement: {
                type: 'array',
                items: { type: 'string' },
                description: 'Main areas needing improvement'
              },
              nextSteps: {
                type: 'array',
                items: { type: 'string' },
                description: 'Recommended next steps for improvement'
              }
            },
            required: ['overallFeedback', 'keyStrengths', 'areasForImprovement', 'nextSteps']
          }
        },
        required: ['overallScore', 'questionEvaluations', 'sessionSummary']
      }
    }
  }

  return callOpenAI(userPrompt, {
    ...options,
    tools: [batchEvaluationTool],
    toolChoice: { type: 'function', function: { name: 'evaluate_interview_answers' } }
  })
}

export async function callOpenAIResumeAnalysis(
  userPrompt: string,
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const resumeAnalysisTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: 'function',
    function: {
      name: 'analyze_resume',
      description: 'Analyze a resume against a job description and provide detailed scoring and feedback',
      parameters: {
        type: 'object',
        properties: {
          overallScore: {
            type: 'number',
            description: 'Overall score from 0-100 based on resume quality and job match',
            minimum: 0,
            maximum: 100
          },
          scoringBreakdown: {
            type: 'object',
            description: 'Detailed breakdown of scoring components',
            properties: {
              skills: {
                type: 'number',
                description: 'Skills match score out of 40 points',
                minimum: 0,
                maximum: 40
              },
              experience: {
                type: 'number',
                description: 'Experience relevance score out of 35 points',
                minimum: 0,
                maximum: 35
              },
              achievements: {
                type: 'number',
                description: 'Achievement alignment score out of 20 points',
                minimum: 0,
                maximum: 20
              },
              presentation: {
                type: 'number',
                description: 'Presentation quality score out of 5 points',
                minimum: 0,
                maximum: 5
              }
            },
            required: ['skills', 'experience', 'achievements', 'presentation']
          },
          scoreJustification: {
            type: 'string',
            description: 'Detailed markdown-formatted explanation of the score with emojis and professional tone'
          },
          scoreLabel: {
            type: 'string',
            enum: ['Exceptional Match', 'Strong Match', 'Good Match', 'Fair Match', 'Weak Match', 'Poor Match'],
            description: 'Label describing the overall score level'
          },
          strengths: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of 3-5 strong points that give competitive advantage',
            minItems: 3,
            maxItems: 5
          },
          weaknesses: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of 3-7 critical issues that need attention',
            minItems: 3,
            maxItems: 7
          },
          suggestions: {
            type: 'array',
            description: 'Specific actionable improvement suggestions',
            items: {
              type: 'object',
              properties: {
                section: {
                  type: 'string',
                  description: 'Resume section this suggestion applies to'
                },
                issue: {
                  type: 'string',
                  description: 'Specific issue identified'
                },
                solution: {
                  type: 'string',
                  description: 'Actionable solution with examples'
                },
                priority: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Priority level for this improvement'
                }
              },
              required: ['section', 'issue', 'solution', 'priority']
            }
          },
          keywordMatch: {
            type: 'object',
            description: 'Keyword analysis for ATS optimization',
            properties: {
              matched: {
                type: 'array',
                items: { type: 'string' },
                description: 'Keywords found in both resume and job description'
              },
              missing: {
                type: 'array',
                items: { type: 'string' },
                description: 'Important keywords missing from resume'
              },
              matchPercentage: {
                type: 'number',
                description: 'Percentage of important keywords matched',
                minimum: 0,
                maximum: 100
              }
            },
            required: ['matched', 'missing', 'matchPercentage']
          },
          atsIssues: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of ATS compatibility issues found'
          }
        },
        required: [
          'overallScore',
          'scoringBreakdown', 
          'scoreJustification',
          'scoreLabel',
          'strengths',
          'weaknesses',
          'suggestions',
          'keywordMatch',
          'atsIssues'
        ]
      }
    }
  }

  const response = await callOpenAI(userPrompt, {
    ...options,
    tools: [resumeAnalysisTool],
    toolChoice: { type: 'function', function: { name: 'analyze_resume' } }
  })

  // Validate and fix the analysis data to ensure all scores are within proper ranges
  try {
    const validatedData = validateAnalysisData(response.data)
    console.log('✅ Analysis data validated and corrected')
    
    return {
      ...response,
      data: validatedData
    }
  } catch (validationError) {
    console.error('❌ Analysis data validation failed:', validationError)
    console.error('❌ Original data:', JSON.stringify(response.data, null, 2))
    throw new Error('Invalid analysis data structure returned by AI')
  }
}

/**
 * Enhanced callOpenAI function that supports multimodal content (text + images)
 */
export async function callOpenAIWithContent<T = any>(
  content: any[], // Array of content blocks (text and images)
  options: OpenAICallOptions = {}
): Promise<OpenAIResponse<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const startTime = Date.now()

  console.log('🚀 Starting OpenAI API call with multimodal content...')
  console.log('Model:', opts.model)
  console.log('Max tokens:', opts.maxTokens)
  console.log('Temperature:', opts.temperature)
  console.log('Content blocks:', content.length)

  try {
    // Prepare messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
    
    if (opts.systemPrompt) {
      messages.push({
        role: 'system',
        content: opts.systemPrompt
      })
    }
    
    messages.push({
      role: 'user',
      content: content
    })

    // Prepare request options
    const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: opts.model,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }

    // Add JSON format enforcement if requested (and no tools)
    if (opts.enforceJSON && !opts.tools) {
      requestOptions.response_format = { type: 'json_object' }
    }

    // Add tools if provided
    if (opts.tools && opts.tools.length > 0) {
      requestOptions.tools = opts.tools
      if (opts.toolChoice) {
        requestOptions.tool_choice = opts.toolChoice
      }
    }

    // Make the API call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout)

    let completion: OpenAI.Chat.Completions.ChatCompletion
    try {
      completion = await openai.chat.completions.create(requestOptions)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${opts.timeout / 1000} seconds`)
      }
      throw error
    }

    clearTimeout(timeoutId)
    const apiCallTime = Date.now() - startTime
    console.log(`✅ OpenAI multimodal API call completed in ${apiCallTime}ms`)

    const message = completion.choices[0]?.message
    if (!message) {
      throw new Error('No message generated')
    }

    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    const cost = calculateCost(opts.model, usage.prompt_tokens, usage.completion_tokens)
    const finishReason = completion.choices[0]?.finish_reason || 'stop'

    let parsedData: T
    let finalContent = ''

    // Handle function calling response
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('✅ Function call response received')
      const toolCall = message.tool_calls[0]
      if (toolCall.function?.arguments) {
        try {
          parsedData = JSON.parse(toolCall.function.arguments) as T
          finalContent = toolCall.function.arguments
          console.log('✅ Function call arguments parsed successfully')
        } catch (parseError) {
          console.error('❌ Failed to parse function call arguments:', parseError)
          throw new Error('Failed to parse function call response')
        }
      } else {
        throw new Error('No function arguments in tool call')
      }
    } else {
      // Handle regular content response
      const content = message.content
      if (!content) {
        throw new Error('No content generated')
      }
      finalContent = content

      // Handle JSON parsing if enforced
      if (opts.enforceJSON) {
        try {
          parsedData = JSON.parse(content) as T
          console.log('✅ JSON parsing successful')
        } catch (parseError) {
          console.error('❌ JSON parsing failed despite enforcement:', parseError)
          throw new Error('Failed to parse JSON response despite enforcement')
        }
      } else {
        // Try to parse as JSON if it looks like JSON, otherwise return as string
        if (!content.includes('{')) {
          console.log('✅ No JSON braces found, returning as plain text')
          parsedData = content as T
        } else {
          try {
            parsedData = parseJSONResponse(content) as T
            console.log('✅ JSON parsing successful')
          } catch (parseError) {
            // Return content as string if not JSON
            parsedData = content as T
          }
        }
      }
    }

    const processingTime = Date.now() - startTime
    const finalCost = calculateCost(opts.model, usage.prompt_tokens, usage.completion_tokens)

    console.log('📊 OpenAI multimodal call completed successfully')
    console.log('Processing time:', processingTime, 'ms')
    console.log('Tokens used:', usage.total_tokens)
    console.log('Cost:', finalCost)

    return {
      data: parsedData,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      cost: finalCost,
      processingTime,
      finishReason
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error('❌ OpenAI multimodal API call failed:', error)
    
    // Create a more informative error
    const openaiError: OpenAIError = new Error(error.message || 'OpenAI multimodal API call failed')
    openaiError.code = error.code
    openaiError.status = error.status
    openaiError.type = error.type
    openaiError.name = 'OpenAIError'
    
    throw openaiError
  }
}

/**
 * Helper function for PDF extraction with vision capabilities using OpenAI
 */
export async function callOpenAIPDFExtractionWithVision(
  userPrompt: string,
  images: string[], // Base64 encoded images
  options: Omit<OpenAICallOptions, 'tools' | 'toolChoice' | 'enforceJSON'> = {}
): Promise<OpenAIResponse<any>> {
  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'extract_resume_content',
        description: 'Extracts and formats resume content from PDF images as clean, professional markdown',
        parameters: {
          type: 'object',
          properties: {
            markdown: {
              type: 'string',
              description: 'The extracted content formatted as clean, professional markdown'
            },
            summary: {
              type: 'string',
              description: 'A brief summary of the resume content and key highlights'
            },
            sections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of main sections found in the resume (e.g., Personal Info, Experience, Education, Skills)'
            },
            personalInfo: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                location: { type: 'string' },
                linkedin: { type: 'string' },
                website: { type: 'string' }
              }
            },
            keySkills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key technical and professional skills identified'
            },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  company: { type: 'string' },
                  duration: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  degree: { type: 'string' },
                  institution: { type: 'string' },
                  year: { type: 'string' }
                }
              }
            }
          },
          required: ['markdown', 'summary', 'sections']
        }
      }
    }
  ]

  // Create content array with images and text
  const content: any[] = []
  
  // Add images first
  images.forEach((imageBase64, index) => {
    if (index > 0) {
      content.push({
        type: 'text',
        text: `\n\nPage ${index + 1}:`
      })
    }
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/png;base64,${imageBase64}`,
        detail: 'high' // Use high detail for better text extraction
      }
    })
  })
  
  // Add the text prompt
  content.push({
    type: 'text',
    text: userPrompt
  })

  // Use the enhanced callOpenAI function with multimodal content
  return callOpenAIWithContent(content, {
    ...options,
    tools,
    toolChoice: { type: 'function', function: { name: 'extract_resume_content' } }
  })
}

/**
 * Validate and fix scoring breakdown to ensure all values are within proper ranges
 */
function validateScoringBreakdown(scoringBreakdown: any): any {
  if (!scoringBreakdown || typeof scoringBreakdown !== 'object') {
    return {
      skills: 0,
      experience: 0,
      achievements: 0,
      presentation: 0
    }
  }

  const originalPresentation = Number(scoringBreakdown.presentation) || 0
  const validatedPresentation = Math.max(0, Math.min(5, originalPresentation))
  
  // Log if we had to correct a negative presentation score
  if (originalPresentation < 0) {
    console.log(`🔧 Corrected negative presentation score: ${originalPresentation} → ${validatedPresentation}`)
  }

  return {
    skills: Math.max(0, Math.min(40, Number(scoringBreakdown.skills) || 0)),
    experience: Math.max(0, Math.min(35, Number(scoringBreakdown.experience) || 0)),
    achievements: Math.max(0, Math.min(20, Number(scoringBreakdown.achievements) || 0)),
    presentation: validatedPresentation
  }
}

/**
 * Validate and fix overall analysis data to ensure consistency
 */
function validateAnalysisData(analysisData: any): any {
  if (!analysisData || typeof analysisData !== 'object') {
    throw new Error('Invalid analysis data structure')
  }

  // Validate scoring breakdown
  const validatedBreakdown = validateScoringBreakdown(analysisData.scoringBreakdown)
  
  // Calculate corrected overall score based on validated breakdown
  const calculatedScore = validatedBreakdown.skills + validatedBreakdown.experience + 
                         validatedBreakdown.achievements + validatedBreakdown.presentation
  
  // Ensure overall score is within 0-100 range
  const overallScore = Math.max(0, Math.min(100, Number(analysisData.overallScore) || calculatedScore))

  // Ensure strengths and weaknesses have minimum required items
  let strengths = Array.isArray(analysisData.strengths) ? analysisData.strengths : []
  let weaknesses = Array.isArray(analysisData.weaknesses) ? analysisData.weaknesses : []
  
  // Add default strengths if empty or insufficient
  if (strengths.length === 0) {
    strengths = [
      'Resume contains basic required information',
      'Document structure is readable',
      'Contact information is present'
    ]
    console.log('🔧 Added default strengths due to empty array in validation')
  }
  
  // Add default weaknesses if empty or insufficient  
  if (weaknesses.length === 0) {
    weaknesses = [
      'Could benefit from more detailed analysis',
      'Consider adding quantified achievements',
      'May need better keyword optimization'
    ]
    console.log('🔧 Added default weaknesses due to empty array in validation')
  }

  const result = {
    ...analysisData,
    overallScore,
    scoringBreakdown: validatedBreakdown,
    // Ensure other required fields have defaults
    strengths,
    weaknesses,
    suggestions: Array.isArray(analysisData.suggestions) ? analysisData.suggestions : [],
    keywordMatch: analysisData.keywordMatch || { matched: [], missing: [], matchPercentage: 0 },
    atsIssues: Array.isArray(analysisData.atsIssues) ? analysisData.atsIssues : []
  }
  
  console.log('🔍 Validation result keys:', Object.keys(result))
  return result
} 