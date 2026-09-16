import { Leaf, Truck, Lock, Heart } from 'lucide-react'
import { Reveal } from '@/components/reveal'

const items = [
  {
    icon: Leaf,
    title: 'Ingrédients naturels',
    text: 'Sélectionnés avec soin',
  },
  {
    icon: Truck,
    title: 'Livraison',
    text: 'Partout dans le monde',
  },
  {
    icon: Lock,
    title: 'Paiement sécurisé',
    text: '100% sécurisé',
  },
]

export function TrustBar() {
  return (
    <section className="relative z-30 mt-4 mb-16 px-4 md:-mt-16">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white px-6 py-8 shadow-sm">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 lg:gap-x-12">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 70} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center text-primary">
                <item.icon className="h-7 w-7 stroke-[1.5]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-primary">{item.title}</h3>
                <p className="text-xs text-primary/70">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
