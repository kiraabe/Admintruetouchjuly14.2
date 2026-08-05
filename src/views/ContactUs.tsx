import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import { toast } from 'sonner'

interface ContactMessage {
  id?: number
  contact_id: string
  username: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'resolved'
  first_read_at?: string
  created_at: string
  updated_at: string
}

const ContactUs = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    filterMessages()
  }, [searchTerm, messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contact-us')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        const newMessages = data.data || []
        // Ensure all required fields are present
        const processedMessages = newMessages.map((msg: ContactMessage) => ({
          ...msg,
          username: msg.username || 'Unknown',
          email: msg.email || 'N/A',
          subject: msg.subject || 'No Subject',
          message: msg.message || '',
        }))
        setMessages(processedMessages)
      } else {
        toast.error(data.error || 'Failed to load messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const filterMessages = () => {
    const filtered = messages.filter((msg) =>
      (msg.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (msg.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (msg.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    setFilteredMessages(filtered)
    setCurrentPage(1)
  }

  const handleViewDetail = async (message: ContactMessage) => {
    if (!message.id) {
      toast.error('Unable to open this message')
      return
    }

    try {
      const response = await fetch(`/api/contact-us/${message.id}/read`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to open message')
      }

      const openedMessage = data.data as ContactMessage
      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage.id === openedMessage.id ? { ...currentMessage, ...openedMessage } : currentMessage,
        ),
      )
      setSelectedMessage(openedMessage)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error opening contact message:', error)
      toast.error('Failed to open message')
    }
  }

  const handleReply = (message: ContactMessage) => {
    setSelectedMessage(message)
    setShowReplyModal(true)
  }

  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage)

  const getStatusBadgeClass = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-600 text-white'
      case 'read':
        return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
      case 'replied':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <Button onClick={fetchMessages}>Refresh</Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by name, email, or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading messages...</div>
      ) : paginatedMessages.length === 0 ? (
        <div className="text-center py-8">No messages found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMessages.map((msg) => (
                  <tr key={msg.id || msg.contact_id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-3 font-medium">{msg.username || 'Unknown'}</td>
                    <td className="px-4 py-3">{msg.email || 'N/A'}</td>
                    <td className="px-4 py-3">{msg.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(msg.status)}`}>
                        {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(msg.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewDetail(msg)}
                          className="text-xs"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReply(msg)}
                          className="text-xs"
                        >
                          Reply
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Dialog
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        width={900}
        scrollable={false}
      >
        {selectedMessage && (
          <div className="-m-2">
            <div className="border-b border-gray-200 dark:border-gray-700 px-2 pb-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Contact message</p>
              <h2 className="text-xl font-bold heading-text">{selectedMessage.subject}</h2>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  {selectedMessage.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold heading-text">{selectedMessage.username}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selectedMessage.email}</p>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  <p>{new Date(selectedMessage.created_at).toLocaleDateString()}</p>
                  <p>{new Date(selectedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
            <div className="px-2 py-6">
              {selectedMessage.phone && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Phone: {selectedMessage.phone}</p>
              )}
              <p className="whitespace-pre-wrap leading-7 text-gray-700 dark:text-gray-200">{selectedMessage.message}</p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-2 pt-4 flex justify-end gap-2">
              <Button variant="default" onClick={() => setShowDetailModal(false)}>Close</Button>
              <Button variant="solid" onClick={() => {
                setShowDetailModal(false)
                handleReply(selectedMessage)
              }}>
                Reply
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Reply Modal */}
      <Dialog
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        width={900}
        scrollable={false}
      >
        <div className="text-center py-8 px-6">
          <h2 className="text-xl font-bold heading-text">Reply coming soon</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Replying to contact messages will be available soon.
          </p>
          <Button className="mt-6" variant="solid" onClick={() => setShowReplyModal(false)}>
            Close
          </Button>
        </div>
      </Dialog>
    </Card>
  )
}

export default ContactUs
