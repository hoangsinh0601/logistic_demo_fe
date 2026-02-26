import React, { useState, useMemo } from "react";
import {
    useGetRoles,
    useGetPermissions,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useUpdateRolePermissions,
} from "@/hooks/useRoles";
import { useTranslation } from "react-i18next";
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

export const RoleManagement: React.FC = () => {
    const { t } = useTranslation();
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

    const getPermGroupLabel = (group: string): string => {
        const key = `roles.permGroups.${group}`;
        const translated = t(key);
        return translated === key ? group : translated;
    };

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
                    <h1 className="text-2xl font-bold tracking-tight">{t("roles.title")}</h1>
                    <p className="text-muted-foreground">{t("roles.subtitle")}</p>
                </div>
                <Button onClick={() => (showForm ? handleCancel() : setShowForm(true))}>
                    {showForm ? t("common.close") : t("roles.addButton")}
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            {editingId ? t("roles.editTitle") : t("roles.createTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role_name">{t("roles.form.name")}</Label>
                                    <Input
                                        id="role_name"
                                        placeholder={t("roles.form.namePlaceholder")}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role_desc">{t("roles.form.description")}</Label>
                                    <Input
                                        id="role_desc"
                                        placeholder={t("roles.form.descriptionPlaceholder")}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Permission selection for new roles */}
                            {!editingId && (
                                <div className="space-y-3">
                                    <Label>{t("roles.form.permissionsLabel")}</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(permissionGroups).map(([group, groupPerms]) => (
                                            <div key={group} className="rounded-lg border p-3 space-y-2">
                                                <p className="text-sm font-semibold">
                                                    {getPermGroupLabel(group)}
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
                                        ? t("common.saving")
                                        : editingId
                                            ? t("common.update")
                                            : t("roles.form.createButton")}
                                </Button>
                                <Button type="button" variant="ghost" onClick={handleCancel}>
                                    {t("common.cancel")}
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
                            🔐 {t("roles.permMatrix.title")} <Badge className="text-base">{managingRole.name}</Badge>
                            {managingRole.is_system && (
                                <Badge variant="secondary" className="text-xs">{t("roles.system")}</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(permissionGroups).map(([group, groupPerms]) => (
                                <div key={group} className="rounded-lg border p-3 space-y-2">
                                    <p className="text-sm font-semibold">
                                        {getPermGroupLabel(group)}
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
                                {updatePerms.isPending ? t("common.saving") : t("roles.permMatrix.saveButton")}
                            </Button>
                            <Button variant="ghost" onClick={() => setManagingPermsForId(null)}>
                                {t("common.close")}
                            </Button>
                        </div>

                        {updatePerms.isError && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                ❌ {(updatePerms.error as Error)?.message || t("common.errorOccurred")}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Roles Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("roles.listTitle")} {roles ? `(${roles.length})` : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {rolesLoading || permsLoading ? (
                        <p className="text-muted-foreground text-center py-8">{t("common.loading")}</p>
                    ) : !roles || roles.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <p className="text-4xl">🔐</p>
                            <p className="text-muted-foreground">{t("roles.noRoles")}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("roles.columns.role")}</TableHead>
                                        <TableHead>{t("roles.columns.description")}</TableHead>
                                        <TableHead className="text-center">{t("roles.columns.permCount")}</TableHead>
                                        <TableHead>{t("roles.columns.type")}</TableHead>
                                        <TableHead className="text-right">{t("roles.columns.actions")}</TableHead>
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
                                                    <Badge className="bg-purple-100 text-purple-800">{t("roles.system")}</Badge>
                                                ) : (
                                                    <Badge className="bg-cyan-100 text-cyan-800">{t("roles.custom")}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleManagePerms(role)}
                                                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                        title={t("roles.assignPerms")}
                                                    >
                                                        🔑
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(role)}
                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                        title={t("roles.editRole")}
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
                                                                    {deleteRole.isPending ? "..." : t("common.delete")}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                >
                                                                    {t("common.cancel")}
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteConfirmId(role.id)}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                title={t("roles.deleteRole")}
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
                            ❌ {(deleteRole.error as Error)?.message || t("common.deleteFailed")}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
