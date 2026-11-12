# Let It Go

A quiet place to say the things you can't say to the person they're meant for, whether they're gone, out of reach, or someone you'll never speak to again.

You write a recipient and a message, press **Let it go**, and it goes nowhere. Nothing is ever delivered. Your words are kept in a private, encrypted **Sent** folder for as long as you want them, and you can delete them whenever you're ready.

> This is a portfolio project. There is no email on file, so passwords **cannot be reset**. If you forget yours, create a new account.

## Features

- Landing page with sign up and log in
- Write a message to a recipient and "let it go"
- Private Sent folder: read and delete your own messages
- Username and password accounts, no email required

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript
- [Tailwind CSS](https://tailwindcss.com) 4 plus custom CSS
- [Supabase](https://supabase.com): Auth and Postgres

## How it's secured

- **Supabase Auth** handles accounts and sessions. Usernames map to an internal address (`username@letitgo.app`) that is never emailed, so no email is needed.
- **Row Level Security** on the database means each user can only read, create and delete their own messages.
- **Client-side encryption:** recipient and message are encrypted in the browser with AES-GCM before they're saved. The key is derived from your password (PBKDF2) and is never sent to the server, so the database only ever holds ciphertext.
- Because the key comes from your password, a password reset would make old messages unreadable. That's why resetting isn't offered.
- Only the public Supabase URL and anon key are used in the browser. No secrets are stored in this repo.

## Running it yourself

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then add a `.env.local` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. In Supabase, turn off **Authentication → Providers → Email → Confirm email**.

4. Set up the database. `supabase/` holds the SQL I used to move an older custom login to Supabase Auth. For a fresh project you need a `messages` table (`id`, `user_id`, `recipient`, `content`, `created_at`) with the row-level security policies from `supabase/migration.sql`.

5. Start the dev server and open [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

## Project structure

```
app/
  page.tsx              Landing page
  components/AuthForm   Sign up / log in
  profile/page.tsx      Write a message + Sent folder
  lib/encryption.ts     Client-side encryption helpers
  lib/supabase.ts       Supabase client
supabase/               SQL migrations
```

## Known limitations

- Your password is kept in `sessionStorage` for the length of the session so older messages can still be decrypted.
- Usernames are used as the encryption salt rather than a random per-user salt.
