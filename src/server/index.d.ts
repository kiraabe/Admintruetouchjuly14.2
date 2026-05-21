import 'express'

declare global {
  namespace Express {
    interface Request {
      files?: Record<string, Multer.File[]> | Multer.File[]
    }
    namespace Multer {
      interface File {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        destination: string
        filename: string
        path: string
        size: number
      }
    }
  }
}
