import ky from 'ky'

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.sutradharBaseUrl

  const api = ky.create({
    prefixUrl: baseUrl,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  async function post<T>(path: string, body: any): Promise<T> {
    return api.post(path, { json: body }).json<T>()
  }

  async function get<T>(path: string, searchParams?: any): Promise<T> {
    return api.get(path, { searchParams }).json<T>()
  }

  return {
    post,
    get,
    api
  }
}

