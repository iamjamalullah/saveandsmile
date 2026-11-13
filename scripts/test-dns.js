import dns from 'node:dns'

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4'])

dns.resolve4('aws-1-ap-southeast-2.pooler.supabase.com', (err, addrs) => {
  console.log('Google/Cloudflare DNS Result:', err ? err.message : addrs)
})

dns.lookup('aws-1-ap-southeast-2.pooler.supabase.com', (err, addr) => {
  console.log('System DNS Result:', err ? err.message : addr)
})
