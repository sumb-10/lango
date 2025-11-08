export type Material = {
  id: string
  user_id: string
  title: string
  author?: string
  file_path: string
  file_type: 'epub' | 'txt' | 'pdf'
  status: 'uploaded' | 'processing' | 'ingested' | 'failed'
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type Chunk = {
  id: string
  material_id: string
  content: string
  embedding?: number[]
  chunk_index: number
  metadata: Record<string, any>
  created_at: string
}

export type Worksheet = {
  id: string
  material_id: string
  user_id: string
  title: string
  description?: string
  cefr_level?: string
  created_at: string
  updated_at: string
}

export type WorksheetItem = {
  id: string
  worksheet_id: string
  item_type: 'reading_question' | 'writing_prompt' | 'vocabulary' | 'grammar'
  content: Record<string, any>
  order_index: number
  created_at: string
}

export type Feedback = {
  id: string
  user_id: string
  worksheet_id?: string
  scope: 'micro' | 'macro'
  user_text: string
  feedback_data: Record<string, any>
  created_at: string
}

export type RubricEvaluation = {
  id: string
  user_id: string
  feedback_id?: string
  dimensions: Record<string, any>
  total_score?: number
  comments?: string
  created_at: string
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type FileType = 'epub' | 'txt' | 'pdf'

export type MaterialStatus = 'uploaded' | 'processing' | 'ingested' | 'failed'
