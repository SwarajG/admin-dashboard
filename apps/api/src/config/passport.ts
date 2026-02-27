import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { prisma } from '@repo/db'

export function configurePassport(): void {
  // JWT Strategy
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
      },
      async (payload, done) => {
        try {
          const user = await prisma.user.findUnique({ where: { id: payload.id } })
          if (!user || !user.isActive) return done(null, false)
          return done(null, user)
        } catch (err) {
          return done(err, false)
        }
      }
    )
  )

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value
            if (!email) return done(new Error('No email from Google'), undefined)

            let user = await prisma.user.findUnique({ where: { googleId: profile.id } })

            if (!user) {
              user = await prisma.user.findUnique({ where: { email } })
              if (user) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { googleId: profile.id },
                })
              } else {
                user = await prisma.user.create({
                  data: {
                    email,
                    name: profile.displayName || email.split('@')[0],
                    googleId: profile.id,
                    role: 'EMPLOYEE',
                  },
                })
              }
            }

            return done(null, user)
          } catch (err) {
            return done(err as Error, undefined)
          }
        }
      )
    )
  }
}
