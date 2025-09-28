import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: 'https://vybe.build',
  plugins: [ 
    organizationClient() 
  ]
})