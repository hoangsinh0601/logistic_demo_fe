import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetUsers, useDeleteUser } from '@/hooks/useUsers';
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { UserFormModal } from '@/components/molecules/UserFormModal';
import { DataTable, usePagination } from '@/components/molecules/DataTable';
import type { ColumnDef } from '@/components/molecules/DataTable';

export const UserManagement: React.FC = () => {
    const { page, limit, setPage, setLimit } = usePagination(10);
    const { t } = useTranslation();

    const { data, isLoading, error } = useGetUsers(page, limit);
    const deleteUser = useDeleteUser();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    if (isLoading) return <div className="p-8">{t('common.loading')}</div>;
    if (error) return <div className="p-8 text-destructive">{t('common.error')}</div>;

    const users = data?.users || [];
    const total = data?.total || 0;

    const handleCreateNew = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('errors.deleteUserConfirm'))) return;
        try {
            await deleteUser.mutateAsync(id);
        } catch (e) {
            console.error('Failed to delete user', e);
            alert(t('errors.deleteUserFailed'));
        }
    };

    const columns: ColumnDef<User>[] = [
        {
            key: 'username',
            headerKey: 'users.columns.username',
            className: 'font-medium',
            render: (user) => user.username,
        },
        {
            key: 'email',
            headerKey: 'users.columns.email',
            render: (user) => user.email,
        },
        {
            key: 'phone',
            headerKey: 'users.columns.phone',
            render: (user) => user.phone,
        },
        {
            key: 'role',
            headerKey: 'users.columns.role',
            render: (user) => (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground">
                    {user.role}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            headerClassName: 'w-[50px]',
            render: (user) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(user.id)}>
                            <Trash className="mr-2 h-4 w-4" /> {t('common.delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">{t('users.systemUsers', { total })}</CardTitle>
                    <Button onClick={handleCreateNew} size="sm">{t('users.addUser')}</Button>
                </CardHeader>
                <CardContent>
                    <DataTable<User>
                        columns={columns}
                        data={users}
                        rowKey={(user) => user.id}
                        pagination={{
                            page,
                            limit,
                            total,
                            onPageChange: setPage,
                            onLimitChange: setLimit,
                        }}
                    />
                </CardContent>

                <UserFormModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    user={selectedUser}
                />
            </Card>
        </div>
    );
};
