import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  
  const { data, error } = await supabase
    .from("staff")
    .select("*, departments(name), subjects(name)")
    .order("full_name")
  
  if (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log("[v0] POST /api/staff - body:", body)
    
    // Insert without select first
    const insertResult = await supabase
      .from("staff")
      .insert([body])
    
    console.log("[v0] Insert result:", insertResult)
    
    if (insertResult.error) {
      console.error("[v0] Error creating staff:", insertResult.error)
      return NextResponse.json({ error: insertResult.error.message, code: insertResult.error.code }, { status: 500 })
    }
    
    // If insert was successful, return the inserted data
    if (insertResult.data && insertResult.data.length > 0) {
      const insertedId = insertResult.data[0].id
      
      // Fetch with relations
      const { data: staffData, error: fetchError } = await supabase
        .from("staff")
        .select("*, departments(name), subjects(name)")
        .eq("id", insertedId)
        .single()
      
      if (fetchError) {
        console.error("[v0] Error fetching inserted staff:", fetchError)
        return NextResponse.json(insertResult.data[0])
      }
      
      return NextResponse.json(staffData)
    }
    
    return NextResponse.json(insertResult.data)
  } catch (err: any) {
    console.error("[v0] API POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { id, ...staffData } = body
  
  const { data, error } = await supabase
    .from("staff")
    .update(staffData)
    .eq("id", id)
    .select("*, departments(name), subjects(name)")
    .single()
  
  if (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
