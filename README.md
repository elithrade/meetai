This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Then, run the command to start the web-hook for handling messages:

```
npm run dev:webhook
```

Then, run the command to handle background processing tasks:

```
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

To setup third party authentication integration for local development and testing, you will need to create an new app in https://console.cloud.google.com/auth/clients?inv=1&invt=Ab5MPg&project=meetai-465912 for Google, and new OAuth app in GitHub Developer Settings https://github.com/settings/developers for GitHub, then add client id and secret to `.env` file.

Also note that in getstream.io, you will need to setup a new app and configure the webhook URL to point to `http://localhost:3000/api/webhook` for local development.

For local development, you can take a look at the `package.json` file for inngest webhook urls for background processing tasks.
