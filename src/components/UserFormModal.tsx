import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';

interface UserFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
    open,
    onOpenChange,
    user,
}) => {
    const isEditing = !!user;
    const { t } = useTranslation();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('staff');

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    const isPending = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (open) {
            if (isEditing && user) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUsername(user.username);

                setEmail(user.email);

                setPhone(user.phone || '');

                setRole(user.role);

                setPassword(''); // Always clear password on edit load
            } else {
                setUsername('');
                setEmail('');
                setPhone('');
                setRole('staff');
                setPassword('');
            }
            setErrorMsg(null);
        }
    }, [open, isEditing, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        try {
            if (isEditing && user) {
                await updateMutation.mutateAsync({
                    id: user.id,
                    payload: {
                        username,
                        email,
                        phone,
                        role,
                        ...(password ? { password } : {}) // Only send password if updated
                    }
                });
            } else {
                await createMutation.mutateAsync({
                    username, email, phone, role, password
                });
            }
            onOpenChange(false);
        } catch (err: unknown) {
            if (err instanceof Error && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                setErrorMsg(axiosError.response?.data?.message || 'Failed to save user');
            } else {
                setErrorMsg('Failed to save user');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? t('users.userForm.editTitle') : t('users.userForm.createTitle')}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update user details. Leave password blank to keep current password."
                            : "Enter details and base role for the newly created user."}
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            {t('users.userForm.username')}
                        </Label>
                        <Input
                            id="username"
                            className="col-span-3"
                            required
                            placeholder={t('users.userForm.usernamePlaceholder')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            {t('users.userForm.email')}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            className="col-span-3"
                            required
                            placeholder={t('users.userForm.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            {t('users.userForm.phone')}
                        </Label>
                        <Input
                            id="phone"
                            className="col-span-3"
                            required
                            placeholder={t('users.userForm.phonePlaceholder')}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            {t('users.userForm.role')}
                        </Label>
                        <div className="col-span-3">
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('users.userForm.selectRole')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            {t('users.userForm.password')}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            className="col-span-3"
                            required={!isEditing} // Password only required on creation
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isEditing ? t('users.userForm.passwordPlaceholder') : ""}
                            minLength={6}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? t('common.loading') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
