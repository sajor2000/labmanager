'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  name: string
  email: string
  initials: string
  avatarUrl?: string | null
}

export default function TestAvatarsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Fetch real users from the API
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      
      // Transform the data to match our User interface
      const transformedUsers: User[] = data.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials || user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        avatarUrl: user.avatarUrl
      }))
      
      setUsers(transformedUsers)
      if (transformedUsers.length > 0) {
        setSelectedUserId(transformedUsers[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      // Fallback to empty array
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (userId: string, avatarUrl: string | null) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, avatarUrl }
          : user
      )
    )
  }

  const selectedUser = users.find(u => u.id === selectedUserId)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Avatar Upload Test Page
        </h1>
        <p className="text-gray-600">
          Test avatar upload functionality for lab members
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection & Avatar Upload */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select User for Avatar Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {users.map(user => (
                  <Button
                    key={user.id}
                    variant={selectedUserId === user.id ? "default" : "outline"}
                    onClick={() => setSelectedUserId(user.id)}
                    className="justify-start h-auto p-3"
                  >
                    <UserAvatar
                      userId={user.id}
                      name={user.name}
                      initials={user.initials}
                      avatarUrl={user.avatarUrl}
                      size="sm"
                      className="mr-3"
                    />
                    <div className="text-left">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Avatar Upload Component */}
          {selectedUser && (
            <AvatarUpload
              userId={selectedUser.id}
              currentAvatarUrl={selectedUser.avatarUrl}
              userInitials={selectedUser.initials}
              userName={selectedUser.name}
              onAvatarChange={(avatarUrl) => handleAvatarChange(selectedUser.id, avatarUrl)}
              size="xl"
              allowDelete={true}
              storageType="file"
              maxFileSize={5}
            />
          )}
        </div>

        {/* Avatar Display Examples */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avatar Display Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Different Sizes */}
              <div>
                <h3 className="font-semibold mb-3">Different Sizes</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map(size => (
                    <div key={size} className="text-center">
                      <UserAvatar
                        userId={selectedUser?.id}
                        name={selectedUser?.name}
                        initials={selectedUser?.initials}
                        avatarUrl={selectedUser?.avatarUrl}
                        size={size}
                      />
                      <Badge variant="outline" className="mt-1 text-xs">
                        {size}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Team Member Grid */}
              <div>
                <h3 className="font-semibold mb-3">Team Members</h3>
                <div className="grid grid-cols-2 gap-3">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <UserAvatar
                        userId={user.id}
                        name={user.name}
                        initials={user.initials}
                        avatarUrl={user.avatarUrl}
                        size="md"
                        showTooltip={true}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Avatar Stack */}
              <div>
                <h3 className="font-semibold mb-3">Avatar Stack</h3>
                <div className="flex -space-x-2">
                  {users.slice(0, 4).map((user, index) => (
                    <UserAvatar
                      key={user.id}
                      userId={user.id}
                      name={user.name}
                      initials={user.initials}
                      avatarUrl={user.avatarUrl}
                      size="md"
                      className="border-2 border-white ring-2 ring-gray-100"
                      showTooltip={true}
                    />
                  ))}
                  {users.length > 4 && (
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm font-medium text-gray-600">
                      +{users.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Available API Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-sm space-y-1">
                <div><Badge variant="secondary">POST</Badge> /api/users/{'{userId}'}/avatar</div>
                <div><Badge variant="outline">GET</Badge> /api/users/{'{userId}'}/avatar</div>
                <div><Badge variant="destructive">DELETE</Badge> /api/users/{'{userId}'}/avatar</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}