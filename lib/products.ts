import { prisma } from './db'

export type CategorySlug = 'beaute' | 'accessoires' | 'soins' | 'nouveautes'

// Typages pour le frontend basés sur Prisma
export type Category = {
  slug: string
  name: string
  tagline: string
  image: string
}

export type Review = {
  author: string
  rating: number
  date: string
  text: string
}

export type Product = {
  id: string
  slug: string
  name: string
  category: string
  price: number
  oldPrice?: number | null
  isNew: boolean
  inStock: boolean
  stock: number
  shortDescription: string
  description: string
  informations: string[]
  images: string[]
  variants?: { label: string; options: string[] } | null
  reviews: Review[]
  colors?: string[]
  sizes?: string[]
}

// Fonction de transformation Prisma -> Frontend
function mapProduct(p: any): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    price: p.price,
    oldPrice: p.oldPrice,
    isNew: p.isNew,
    inStock: p.inStock,
    stock: p.stock,
    shortDescription: p.shortDescription,
    description: p.description,
    informations: p.informations.sort((a: any, b: any) => a.position - b.position).map((i: any) => i.value),
    images: p.images.sort((a: any, b: any) => a.position - b.position).map((i: any) => i.url),
    variants: p.variants ? { label: p.variants.label, options: JSON.parse(p.variants.options) } : null,
    colors: p.colors ? JSON.parse(p.colors) : undefined,
    sizes: p.sizes ? JSON.parse(p.sizes) : undefined,
    reviews: p.reviews.map((r: any) => ({
      author: r.author,
      rating: r.rating,
      date: r.date.toISOString(),
      text: r.text,
    })),
  }
}

const productInclude = {
  category: true,
  images: true,
  informations: true,
  variants: true,
  reviews: true,
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  })
  return p ? mapProduct(p) : undefined
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  if (slug === 'nouveautes') return getNewProducts()
  
  const products = await prisma.product.findMany({
    where: { category: { slug } },
    include: productInclude,
  })
  return products.map(mapProduct)
}

export async function getNewProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isNew: true },
    include: productInclude,
  })
  return products.map(mapProduct)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  // Par exemple, les 4 produits spécifiques ou les plus récents
  const products = await prisma.product.findMany({
    take: 4,
    orderBy: {
      createdAt: 'desc'
    },
    include: productInclude,
  })
  return products.map(mapProduct)
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { shortDescription: { contains: q } },
        { category: { name: { contains: q } } }
      ]
    },
    include: productInclude,
  })
  return products.map(mapProduct)
}

export async function getCategories(): Promise<Category[]> {
  const cats = await prisma.category.findMany()
  // Add nouveautes manually for the UI as it's a virtual category
  const allCats = cats.map(c => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    image: c.image
  }))
  allCats.push({
    slug: 'nouveautes',
    name: 'Nouveautés',
    tagline: 'Les derniers produits disponibles',
    image: '/images/categories/nouveautes.png'
  })
  return allCats
}

export async function getProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    include: productInclude,
  })
  return products.map(mapProduct)
}
