import React from 'react'
import { NewsletterForm } from './newsletter-form'

export const metadata = {
  title: 'Vyna — Bientôt disponible',
  description: 'Notre boutique en ligne de produits de beauté et accessoires ouvre très bientôt ses portes.',
}

export default function ComingSoonPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden h-full min-h-screen">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8 animate-fade-up">
        <h1 className="text-6xl md:text-8xl font-serif text-primary mb-4 tracking-tight">
          Vyna
        </h1>
        
        <p className="text-xl md:text-2xl text-foreground font-light mb-8">
          Notre boutique de beauté, accessoires et essentiels ouvre très bientôt ses portes.
        </p>
        
        <div className="pt-12">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-4">
            Soyez la première informée du lancement
          </p>
          <NewsletterForm />
        </div>
        
        <div className="pt-24 text-muted-foreground text-sm font-light">
          © {new Date().getFullYear()} VYNA. Tous droits réservés.
        </div>
      </div>
    </div>
  )
}
