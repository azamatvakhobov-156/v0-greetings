'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Staff {
  id: string
  full_name: string
  position: string
  phone?: string
  hire_date?: string
  staff_type: string
}

export default function KadrlarPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0],
    staff_type: 'technical'
  })
  const supabase = createClient()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setStaff(data)
    } catch (error) {
      console.error('[v0] Error fetching staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.full_name || !formData.position) {
      alert('F.I.O. va Lavozim to\'ldirilishi shart')
      return
    }

    try {
      if (editingStaff) {
        const { error } = await supabase
          .from('staff')
          .update(formData)
          .eq('id', editingStaff.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([formData])
        
        if (error) throw error
      }
      
      setIsDialogOpen(false)
      setEditingStaff(null)
      setFormData({
        full_name: '',
        position: '',
        phone: '',
        hire_date: new Date().toISOString().split('T')[0],
        staff_type: 'technical'
      })
      await fetchStaff()
    } catch (error) {
      console.error('[v0] Error saving staff:', error)
      alert('Xodim saqlashda xato: ' + (error instanceof Error ? error.message : 'Noma\'lum xato'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xodimni o\'chirishni tasdiqlaysizmi?')) return

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchStaff()
    } catch (error) {
      console.error('[v0] Error deleting staff:', error)
      alert('Xodim o\'chirishda xato')
    }
  }

  const handleEdit = (s: Staff) => {
    setEditingStaff(s)
    setFormData({
      full_name: s.full_name,
      position: s.position,
      phone: s.phone || '',
      hire_date: s.hire_date || new Date().toISOString().split('T')[0],
      staff_type: s.staff_type
    })
    setIsDialogOpen(true)
  }

  const handleOpenDialog = () => {
    setEditingStaff(null)
    setFormData({
      full_name: '',
      position: '',
      phone: '',
      hire_date: new Date().toISOString().split('T')[0],
      staff_type: 'technical'
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/oquv-bolimi">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Kadrlar bo'limi</h1>
          <p className="text-muted-foreground">Xodimlarni boshqarish va kirish ma'lumotlari</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{staff.length}</div>
            <div className="text-sm text-muted-foreground">Jami xodimlar</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{staff.filter(s => s.staff_type === 'pedagogue').length}</div>
            <div className="text-sm text-muted-foreground">Pedagoglar</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{staff.filter(s => s.staff_type === 'technical').length}</div>
            <div className="text-sm text-muted-foreground">Texnik xodimlar</div>
          </CardContent>
        </Card>
      </div>

      {/* Xodimlar ro'yxati */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Xodimlar</CardTitle>
            <CardDescription>Barcha maktab xodimlarining ro'yxati</CardDescription>
          </div>
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Xodim qo'shish
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Xodimlar topilmadi</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>F.I.O.</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Harakat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/kadrlar/${s.id}`} className="text-primary hover:underline">
                        {s.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{s.position}</TableCell>
                    <TableCell>
                      {s.staff_type === 'pedagogue' ? 'Pedagog' : s.staff_type === 'management' ? 'Rahbariyat' : 'Texnik'}
                    </TableCell>
                    <TableCell>{s.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(s)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}</DialogTitle>
            <DialogDescription>Xodim ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>F.I.O. *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="To'liq ism"
              />
            </div>

            <div className="space-y-2">
              <Label>Lavozim *</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Lavozim nomi"
              />
            </div>

            <div className="space-y-2">
              <Label>Xodim turi</Label>
              <Select value={formData.staff_type} onValueChange={(v) => setFormData({ ...formData, staff_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pedagogue">Pedagog</SelectItem>
                  <SelectItem value="technical">Texnik xodim</SelectItem>
                  <SelectItem value="management">Rahbariyat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+998 90 123 45 67"
              />
            </div>

            <div className="space-y-2">
              <Label>Ishga qabul qilingan sana</Label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
