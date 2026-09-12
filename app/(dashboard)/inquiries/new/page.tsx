import type { Metadata } from 'next'
import { InquiryForm } from '@/components/inquiries/inquiry-form'

export const metadata: Metadata = { title: 'New Inquiry' }

export default function NewInquiryPage() {
  return <InquiryForm />
}
