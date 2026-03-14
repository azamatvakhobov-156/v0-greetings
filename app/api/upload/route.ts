import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 })
    }

    // Fayl hajmini tekshirish (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fayl hajmi 10MB dan oshmasligi kerak' }, { status: 400 })
    }

    // Fayl nomini unikal qilish
    const timestamp = Date.now()
    const uniqueFileName = `tasks/${timestamp}-${file.name}`

    const blob = await put(uniqueFileName, file, {
      access: 'public',
    })

    return NextResponse.json({ 
      url: blob.url,
      pathname: blob.pathname,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Fayl yuklashda xatolik' }, { status: 500 })
  }
}
