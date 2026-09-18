'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteOrder } from '@/app/actions'

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr ? Cette action est irréversible. La commande sera supprimée et les stocks associés seront restaurés si nécessaire.")) {
      startTransition(async () => {
        const res = await deleteOrder(orderId)
        if (res.success) {
          router.push('/admin/commandes')
          router.refresh()
        } else {
          alert(res.error)
        }
      })
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="icon" 
      className="h-9 w-9" 
      onClick={handleDelete}
      disabled={isPending}
      title="Supprimer la commande"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
