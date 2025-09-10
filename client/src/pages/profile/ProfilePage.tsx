/**
 * ProfilePage Component
 * User profile management page with edit functionality
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Save, Edit3, Mail, Calendar, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validations/auth';
import { formatDate } from '@/lib/utils';

/**
 * ProfilePage component for user profile management
 */
export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user, updateProfile } = useAuthStore();
  const { addNotification } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  // Reset form when user data changes or edit mode changes
  React.useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user, reset, isEditing]);

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      setIsLoading(true);

      // Only send fields that have been changed and are not empty
      const updates: Partial<ProfileUpdateFormData> = {};

      if (data.firstName && data.firstName !== user?.firstName) {
        updates.firstName = data.firstName;
      }
      if (data.lastName && data.lastName !== user?.lastName) {
        updates.lastName = data.lastName;
      }
      if (data.email && data.email !== user?.email) {
        updates.email = data.email;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        setIsEditing(false);
      } else {
        addNotification({
          type: 'info',
          title: 'No Changes',
          message: 'No changes were made to your profile.',
        });
        setIsEditing(false);
      }
    } catch (error: any) {
      // Error notification is handled by the auth store
      console.error('Profile update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset(); // Reset form to original values
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Generate user initials for avatar fallback
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar */}
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {formatDate(user.createdAt, { year: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>

              {/* User Status Badge */}
              <div className="flex flex-col gap-2">
                {user.isAdmin && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Administrator
                  </Badge>
                )}
                <Badge variant="outline">Verified Account</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-medium mb-4">Personal Information</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      {...register('firstName')}
                      disabled={!isEditing}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      {...register('lastName')}
                      disabled={!isEditing}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-medium mb-4">Contact Information</h4>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    disabled={!isEditing}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons (only show when editing) */}
              {isEditing && (
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting || isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isLoading || !isDirty}>
                    {isSubmitting || isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Statistics */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Your account activity and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">$0.00</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">0%</div>
              <div className="text-sm text-muted-foreground">Savings from Coupons</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
