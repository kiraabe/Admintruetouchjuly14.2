import { Router } from 'express'
import { signIn } from './signIn.ts'
import { signUp } from './signUp.ts'

const router = Router()

router.post('/sign-in', signIn)
router.post('/sign-up', signUp)
router.post('/sign-out', (req, res) => {
  res.json({ message: 'Signed out successfully' })
})

export default router
