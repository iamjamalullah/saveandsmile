import 'dotenv/config'

const url = process.env.DATABASE_URL || ''
if (url.includes('aws-1-ap-southeast-2.pooler.supabase.com')) {
  console.log('DESTINATION CONFIRMED: aws-1-ap-southeast-2.pooler.supabase.com ✓')
} else {
  console.error('DESTINATION MISMATCH!')
  process.exit(1)
}
