import { Prisma, PrismaClient } from '@prisma/client';
import sluggify from '../../lib/sluggify';

const prisma = new PrismaClient();


export default async function handler(req, res) {
    if (req.method === 'POST') {
        return await publishPost(req, res);
    }
    else {
        return res.status(405).json({ message: 'Method not allowed', success: false });
    }
}

async function publishPost(req, res) {
    const body = req.body;

    const slug = sluggify(body.title) + '-' + Math.floor(Math.random() * 1000000);

    try {
        const newEntry = await prisma.post.upsert({
            where: {
                id: body.id? body.id : 0
            },
            update: {
                title: body.title,
                content: JSON.parse(body.content) as Prisma.JsonObject
            },
            create: {
                title: body.title,
                slug: slug,
                content: JSON.parse(body.content) as Prisma.JsonObject,
                authorId: 1,
                published: true
            }
        })
        return res.status(200).json(newEntry, { success: true });
    } catch (error) {
        console.error("Request error", error);
        res.status(500).json({ error: "Error creating question", success: false });
    }
}

