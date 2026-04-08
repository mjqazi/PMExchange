import { Pool, QueryResult } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const query = (text: string, params?: unknown[]): Promise<QueryResult> =>
  pool.query(text, params)

export const queryOne = async <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> => {
  const { rows } = await pool.query(text, params)
  return (rows[0] as T) || null
}

export default pool
