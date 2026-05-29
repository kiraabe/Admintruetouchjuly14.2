import express, { Request, Response } from 'express'
import {
  getContactMessages,
  getContactMessageById,
  createContactMessage,
  updateContactStatus,
  deleteContactMessage,
} from '../../db/queries/contactQueries.ts'

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const messages = await getContactMessages()
    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error('Error fetching contact messages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact messages',
    })
  }
})

router.get('/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params
    const message = await getContactMessageById(contactId)

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: message,
    })
  } catch (error) {
    console.error('Error fetching contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact message',
    })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    const newMessage = await createContactMessage(name, email, subject, message, phone)

    res.status(201).json({
      success: true,
      data: newMessage,
    })
  } catch (error) {
    console.error('Error creating contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create contact message',
    })
  }
})

router.patch('/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      })
    }

    const updatedMessage = await updateContactStatus(contactId, status)

    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: updatedMessage,
    })
  } catch (error) {
    console.error('Error updating contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update contact message',
    })
  }
})

router.delete('/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params

    const deletedMessage = await deleteContactMessage(contactId)

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: deletedMessage,
    })
  } catch (error) {
    console.error('Error deleting contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact message',
    })
  }
})

router.post('/:contactId/reply', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params
    const { reply } = req.body

    if (!reply) {
      return res.status(400).json({
        success: false,
        error: 'Reply message is required',
      })
    }

    // Update status to replied
    const updatedMessage = await updateContactStatus(contactId, 'replied')

    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: updatedMessage,
    })
  } catch (error) {
    console.error('Error sending reply:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send reply',
    })
  }
})

export default router
