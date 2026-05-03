import "server-only";
import { prisma } from "@/lib/prisma";

type BookFilters = {
  genre?: string;
  query?: string;
  limit?: number;
};

function buildWhereClause({ genre, query }: BookFilters) {
  const filters = [];

  if (genre && genre !== "All") {
    filters.push({
      genre: {
        contains: genre,
        mode: "insensitive" as const,
      },
    });
  }

  if (query) {
    filters.push({
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { author: { contains: query, mode: "insensitive" as const } },
        { narrator: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
      ],
    });
  }

  return filters.length > 0 ? { AND: filters } : {};
}

export async function getFreeShelfBooks() {
  return prisma.book.findMany({
    where: { isFree: true },
    orderBy: { createdAt: "asc" },
    take: 5,
  });
}

export async function getFeaturedCatalogBooks() {
  return prisma.book.findMany({
    where: { isFree: false, status: "ready" },
    orderBy: { title: "asc" },
    take: 6,
  });
}

export async function getCatalogBooks(filters: BookFilters = {}) {
  return prisma.book.findMany({
    where: buildWhereClause(filters),
    orderBy: [{ isFree: "desc" }, { title: "asc" }],
    take: filters.limit,
  });
}

export async function getBookById(id: string) {
  return prisma.book.findUnique({
    where: { id },
  });
}

export async function getGenres() {
  const genres = await prisma.book.findMany({
    distinct: ["genre"],
    orderBy: { genre: "asc" },
    select: { genre: true },
  });

  return genres.map((item) => item.genre);
}
