'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Loader2, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'
import { COUNTRIES } from '@/lib/countries'
import { createOrder } from '@/app/actions'

const steps = [
  { id: 1, title: 'Informations' },
  { id: 2, title: 'Livraison' },
  { id: 3, title: 'Paiement' }
]

export function CheckoutForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const { subtotal, items, clear } = useCart()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    complement: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const filterCountries = (value: string, search: string) => {
    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    return normalize(value).includes(normalize(search)) ? 1 : 0
  }

  const phonePrefix = COUNTRIES.find(c => c.code === selectedCountry)?.prefix || '+...'

  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col">
      {/* Steps indicator */}
      <div className="mb-10 flex items-center justify-between sm:justify-start sm:gap-4 text-sm">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step.id < currentStep 
                ? 'bg-primary text-primary-foreground' 
                : step.id === currentStep 
                  ? 'bg-foreground text-background' 
                  : 'bg-secondary text-muted-foreground'
            }`}>
              {step.id < currentStep ? <Check className="h-3.5 w-3.5" /> : step.id}
            </div>
            <span className={`hidden sm:inline-block ${
              step.id <= currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}>
              {step.title}
            </span>
            {idx < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="flex-1">
          {currentStep === 1 && (
            <div className="flex flex-col gap-6">
              <h3 className="font-medium">Informations personnelles</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="Votre prénom" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom complet</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Votre nom" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="votre@email.com" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-md border border-input border-r-0 bg-muted/50 px-3 text-sm text-muted-foreground">
                      {phonePrefix}
                    </span>
                    <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} className="rounded-l-none" placeholder="6 00 00 00 00" />
                  </div>
                </div>
              </div>

              <h3 className="mt-4 font-medium">Adresse</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="country">Pays</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          !selectedCountry && "text-muted-foreground"
                        )}
                      >
                        {selectedCountry
                          ? COUNTRIES.find((country) => country.code === selectedCountry)?.name
                          : "Sélectionnez un pays..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
                      <Command filter={filterCountries}>
                        <CommandInput placeholder="Rechercher un pays..." />
                        <CommandList>
                          <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                          <CommandGroup>
                            {COUNTRIES.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={country.name}
                                onSelect={() => {
                                  setSelectedCountry(country.code)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCountry === country.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {country.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" value={formData.city} onChange={handleChange} placeholder="Votre ville" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Adresse complète</Label>
                  <Input id="address" value={formData.address} onChange={handleChange} placeholder="N° et nom de rue" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="complement">Informations complémentaires (facultatif)</Label>
                  <Input id="complement" value={formData.complement} onChange={handleChange} placeholder="Bâtiment, étage, interphone..." />
                </div>
              </div>

              <Button 
                size="lg" 
                className="mt-4 w-full sm:w-auto sm:self-start"
                onClick={() => setCurrentStep(2)}
              >
                Continuer vers la livraison
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-6">
              <h3 className="font-medium">Méthode de livraison</h3>
              <div className="flex flex-col gap-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full border border-primary">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <span>Livraison standard</span>
                  </div>
                  <span className="font-medium">Gratuit</span>
                </div>
                <p className="pl-7 text-sm text-muted-foreground">3 à 5 jours ouvrés.</p>
              </div>

              <div className="mt-4 flex gap-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>Retour</Button>
                <Button onClick={() => setCurrentStep(3)}>Continuer vers le paiement</Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-6">
              <h3 className="font-medium">Méthode de paiement</h3>

              {/* Payment options */}
              <div className="flex flex-col gap-3">
                {[
                  {
                    id: 'WAVE',
                    label: 'Wave',
                    description: 'Paiement manuel via Wave',
                    emoji: '🌊',
                    image: '/images/wave-logo.png',
                    color: 'bg-sky-50 border-sky-200',
                    activeColor: 'bg-sky-100 border-sky-500',
                  },
                  {
                    id: 'ORANGE_MONEY',
                    label: 'Orange Money',
                    description: 'Paiement manuel via Orange Money',
                    emoji: '🟠',
                    image: '/images/orange-money-logo.png',
                    color: 'bg-orange-50 border-orange-200',
                    activeColor: 'bg-orange-100 border-orange-500',
                  },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      paymentMethod === method.id ? method.activeColor : method.color + ' hover:opacity-90'
                    }`}
                  >
                    {method.image ? (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-white border border-black/5 p-1.5 shadow-sm">
                        <img src={method.image} alt={method.label} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-3xl">{method.emoji}</span>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{method.label}</div>
                      <div className="text-sm text-muted-foreground">{method.description}</div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method.id ? 'border-foreground' : 'border-muted-foreground'
                    }`}>
                      {paymentMethod === method.id && (
                        <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Instructions de paiement manuel */}
              {(paymentMethod === 'WAVE' || paymentMethod === 'ORANGE_MONEY') && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                  <p className="font-semibold mb-1">📱 Instruction de paiement manuel</p>
                  <p>
                    Veuillez envoyer le montant de <strong>{formatPrice(subtotal)}</strong> au numéro suivant : <br/>
                    <span className="text-lg font-bold tracking-wider block mt-1">+223 94 02 81 74</span>
                  </p>
                  <p className="mt-2 text-xs">
                    (Compte au nom de Aminata Keïta). <br/>
                    Cliquez sur <strong>"Confirmer la commande"</strong> après avoir fait le dépôt. Nous validerons votre commande dès réception du transfert.
                  </p>
                </div>
              )}

              <div className="mt-4 flex gap-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isSubmitting}>Retour</Button>
                <Button
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || !paymentMethod}
                  onClick={async () => {
                    setIsSubmitting(true)

                    const countryName = COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry

                    // 1. Créer la commande en base
                    const orderResult = await createOrder({
                      ...formData,
                      country: countryName,
                      subtotal: subtotal,
                      items: items,
                      paymentMethod,
                    })

                    setIsSubmitting(false)

                    if (orderResult.error) {
                      toast.error(orderResult.error)
                      return
                    }

                    // 2. Redirection (Paiement manuel direct)
                    clear()
                    toast.success('Commande confirmée avec succès ! Nous la traiterons très vite.')
                    router.push('/')
                  }}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer la commande

                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Mini-summary on the right */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-medium">Votre commande</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span>{currentStep > 1 ? 'Gratuit' : '—'}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
