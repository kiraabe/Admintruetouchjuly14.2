import * as express from 'express'

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
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
