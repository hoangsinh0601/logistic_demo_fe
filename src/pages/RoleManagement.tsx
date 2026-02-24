import React, { useState, useMemo } from "react";
import {
    useGetRoles,
    useGetPermissions,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useUpdateRolePermissions,
} from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import type { Role } from "@/types";

const PERM_GROUP_LABELS: Record<string, string> = {
    dashboard: "📊 Dashboard",
    inventory: "📦 Kho hàng",
    expenses: "💰 Chi phí",
    tax: "📋 Thuế suất",
    users: "👥 Người dùng",
    audit: "📜 Lịch sử",
    roles: "🔐 Phân quyền",
};

export const RoleManagement: React.FC = () => {
    const { data: roles, isLoading: rolesLoading } = useGetRoles();
    const { data: permissions, isLoading: permsLoading } = useGetPermissions();
    const createRole = useCreateRole();
    const updateRole = useUpdateRole();
    const deleteRole = useDeleteRole();
    const updatePerms = useUpdateRolePermissions();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
    const [managingPermsForId, setManagingPermsForId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Group permissions by category
    const permissionGroups = useMemo(() => {
        if (!permissions) return {};
        const groups: Record<string, typeof permissions> = {};
        permissions.forEach((p) => {
            if (!groups[p.group]) groups[p.group] = [];
            groups[p.group].push(p);
        });
        return groups;
    }, [permissions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccess = () => {
            setName("");
            setDescription("");
            setShowForm(false);
            setEditingId(null);
        };

        if (editingId) {
            updateRole.mutate({ id: editingId, payload: { name, description } }, { onSuccess });
        } else {
            createRole.mutate(
                { name, description, permissions: Array.from(selectedPermIds) },
                { onSuccess: () => { onSuccess(); setSelectedPermIds(new Set()); } }
            );
        }
    };

    const handleEdit = (role: Role) => {
        setName(role.name);
        setDescription(role.description);
        setEditingId(role.id);
        setShowForm(true);
    };

    const handleManagePerms = (role: Role) => {
        setManagingPermsForId(role.id);
        setSelectedPermIds(new Set(role.permissions.map((p) => p.id)));
    };

    const handleSavePerms = () => {
        if (!managingPermsForId) return;
        updatePerms.mutate(
            { id: managingPermsForId, payload: { permission_ids: Array.from(selectedPermIds) } },
            { onSuccess: () => setManagingPermsForId(null) }
        );
    };

    const togglePerm = (permId: string) => {
        setSelectedPermIds((prev) => {
            const next = new Set(prev);
            if (next.has(permId)) next.delete(permId);
            else next.add(permId);
            return next;
        });
    };

    const handleDelete = (id: string) => {
        deleteRole.mutate(id, { onSuccess: () => setDeleteConfirmId(null) });
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setName("");
        setDescription("");
    };

    const managingRole = roles?.find((r) => r.id === managingPermsForId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý Phân quyền</h1>
                    <p className="text-muted-foreground">
                        Tạo và quản lý vai trò, gán quyền cho từng vai trò.
                    </p>
                </div>
                <Button onClick={() => (showForm ? handleCancel() : setShowForm(true))}>
                    {showForm ? "Đóng" : "+ Tạo vai trò mới"}
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            {editingId ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role_name">Tên vai trò *</Label>
                                    <Input
                                        id="role_name"
                                        placeholder="VD: accountant, viewer..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role_desc">Mô tả</Label>
                                    <Input
                                        id="role_desc"
                                        placeholder="VD: Kế toán — chỉ xem chi phí và thuế"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Permission selection for new roles */}
                            {!editingId && (
                                <div className="space-y-3">
                                    <Label>Quyền hạn (chọn khi tạo mới)</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(permissionGroups).map(([group, groupPerms]) => (
                                            <div key={group} className="rounded-lg border p-3 space-y-2">
                                                <p className="text-sm font-semibold">
                                                    {PERM_GROUP_LABELS[group] || group}
                                                </p>
                                                {groupPerms.map((p) => (
                                                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermIds.has(p.id)}
                                                            onChange={() => togglePerm(p.id)}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        {p.name}
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                                    {(createRole.isPending || updateRole.isPending)
                                        ? "Đang lưu..."
                                        : editingId
                                            ? "Cập nhật"
                                            : "Tạo vai trò"}
                                </Button>
                                <Button type="button" variant="ghost" onClick={handleCancel}>
                                    Hủy
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Permission Matrix Modal */}
            {managingPermsForId && managingRole && (
                <Card className="border-2 border-amber-300 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            🔐 Phân quyền cho vai trò: <Badge className="text-base">{managingRole.name}</Badge>
                            {managingRole.is_system && (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(permissionGroups).map(([group, groupPerms]) => (
                                <div key={group} className="rounded-lg border p-3 space-y-2">
                                    <p className="text-sm font-semibold">
                                        {PERM_GROUP_LABELS[group] || group}
                                    </p>
                                    {groupPerms.map((p) => (
                                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPermIds.has(p.id)}
                                                onChange={() => togglePerm(p.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span>{p.name}</span>
                                            <span className="text-xs text-muted-foreground">({p.code})</span>
                                        </label>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleSavePerms} disabled={updatePerms.isPending}>
                                {updatePerms.isPending ? "Đang lưu..." : "Lưu phân quyền"}
                            </Button>
                            <Button variant="ghost" onClick={() => setManagingPermsForId(null)}>
                                Đóng
                            </Button>
                        </div>

                        {updatePerms.isError && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                ❌ {(updatePerms.error as Error)?.message || "Có lỗi xảy ra"}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Roles Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Danh sách vai trò {roles ? `(${roles.length})` : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {rolesLoading || permsLoading ? (
                        <p className="text-muted-foreground text-center py-8">Đang tải...</p>
                    ) : !roles || roles.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <p className="text-4xl">🔐</p>
                            <p className="text-muted-foreground">Chưa có vai trò nào.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vai trò</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead className="text-center">Số quyền</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.map((role) => (
                                        <TableRow key={role.id}>
                                            <TableCell className="font-semibold capitalize">
                                                {role.name}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                                {role.description || "—"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{role.permissions.length}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {role.is_system ? (
                                                    <Badge className="bg-purple-100 text-purple-800">System</Badge>
                                                ) : (
                                                    <Badge className="bg-cyan-100 text-cyan-800">Custom</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleManagePerms(role)}
                                                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                        title="Phân quyền"
                                                    >
                                                        🔑
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(role)}
                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                        title="Chỉnh sửa"
                                                    >
                                                        ✏️
                                                    </Button>
                                                    {!role.is_system && (
                                                        deleteConfirmId === role.id ? (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(role.id)}
                                                                    disabled={deleteRole.isPending}
                                                                >
                                                                    {deleteRole.isPending ? "..." : "Xóa"}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                >
                                                                    Hủy
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteConfirmId(role.id)}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                title="Xóa"
                                                            >
                                                                🗑️
                                                            </Button>
                                                        )
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {deleteRole.isError && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md mt-4">
                            ❌ {(deleteRole.error as Error)?.message || "Xóa thất bại"}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
