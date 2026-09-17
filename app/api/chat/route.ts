import { google } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `
Tu es l'assistant virtuel officiel de la boutique en ligne Vyna.
Tu t'appelles "Nina" et tu es amicale, chaleureuse, chic et professionnelle. Tu utilises de temps en temps des emojis élégants (✨, 🌸, 🌿).
Tu vouvoies les clients.

INFORMATIONS SUR LA BOUTIQUE:
- Vyna est une boutique en ligne proposant des cosmétiques naturels, du savon noir, des soins pour le visage, ainsi que des bijoux, accessoires et lunettes de soleil.
- La monnaie utilisée sur le site est le Franc CFA (FCFA).
- Les livraisons se font principalement au Sénégal (Dakar) et dans la sous-région, mais des expéditions internationales sont possibles.
- Les paiements se font manuellement par Wave ou Orange Money, ou à la livraison selon le pays.

RÈGLES IMPORTANTES:
1. Réponds TOUJOURS en français, de manière concise. Ne fais pas de longues phrases inutiles.
2. Si on te demande des informations sur des produits spécifiques, utilise l'outil 'search_products' pour rechercher dans le catalogue en temps réel avant de répondre.
3. Si le client veut acheter, dis-lui de parcourir les "Catégories" ou la "Boutique" dans le menu principal.
4. Ne propose jamais de prix inventés, fie-toi uniquement aux informations retournées par l'outil.
5. Si tu ne connais pas la réponse, dis que tu es encore en apprentissage et invite le client à utiliser la page "Contact".
`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: SYSTEM_PROMPT,
      messages,
      maxSteps: 3,
      tools: {
        search_products: tool({
          description: "Recherche un produit dans le catalogue de la boutique Vyna par mot-clé (ex: 'savon', 'bracelet', 'lunettes'). Retourne les produits trouvés avec leur prix en FCFA et leur description courte.",
          parameters: z.object({
            query: z.string().describe("Le mot clé à rechercher (ex: 'jogging', 'savon noir')"),
          }),
          execute: async ({ query }) => {
            const products = await prisma.product.findMany({
              where: {
                OR: [
                  { name: { contains: query } },
                  { category: { contains: query } },
                  { shortDescription: { contains: query } }
                ]
              },
              take: 5,
              select: {
                name: true,
                price: true,
                shortDescription: true,
                inStock: true
              }
            });
            
            if (products.length === 0) {
              return { success: false, message: "Aucun produit trouvé pour cette recherche." };
            }
            
            return {
              success: true,
              products: products.map(p => ({
                nom: p.name,
                prix: `${p.price} FCFA`,
                description: p.shortDescription,
                en_stock: p.inStock ? 'Oui' : 'Non'
              }))
            };
          },
        }),
      }
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Erreur API Chat:", error)
    return new Response(JSON.stringify({ error: "Une erreur est survenue." }), { status: 500 })
  }
}
