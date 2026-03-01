import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { useCreatePartner, useUpdatePartner } from "@/hooks/usePartners";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { Plus, Trash2 } from "lucide-react";
import type { Partner, PartnerType, AddressType } from "@/types";
import { Checkbox } from "@/components/atoms/checkbox";

const PARTNER_TYPES: PartnerType[] = ["CUSTOMER", "SUPPLIER", "BOTH", "CARRIER"];
const ADDRESS_TYPES: AddressType[] = ["BILLING", "SHIPPING", "ORIGIN"];

const addressSchema = z.object({
    address_type: z.enum(["BILLING", "SHIPPING", "ORIGIN"]),
    full_address: z.string().min(1, "Address is required"),
    is_default: z.boolean().default(false),
});

const partnerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH", "CARRIER"]),
    tax_code: z.string().default(""),
    company_name: z.string().default(""),
    bank_account: z.string().default(""),
    contact_person: z.string().default(""),
    phone: z.string().default(""),
    email: z.string().email("Invalid email").or(z.literal("")).default(""),
    is_active: z.boolean().default(true),
    addresses: z.array(addressSchema).default([]),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editPartner?: Partner | null;
}

export const PartnerForm: React.FC<PartnerFormProps> = ({ open, onOpenChange, editPartner }) => {
    const { t } = useTranslation();
    const createMutation = useCreatePartner();
    const updateMutation = useUpdatePartner();
    const isEdit = !!editPartner;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors, isSubmitting },
    } = useForm<PartnerFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(partnerSchema) as any,
        defaultValues: {
            name: "",
            type: "CUSTOMER",
            tax_code: "",
            company_name: "",
            bank_account: "",
            contact_person: "",
            phone: "",
            email: "",
            is_active: true,
            addresses: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "addresses",
    });

    useEffect(() => {
        if (editPartner) {
            reset({
                name: editPartner.name,
                type: editPartner.type,
                tax_code: editPartner.tax_code || "",
                company_name: editPartner.company_name || "",
                bank_account: editPartner.bank_account || "",
                contact_person: editPartner.contact_person || "",
                phone: editPartner.phone || "",
                email: editPartner.email || "",
                is_active: editPartner.is_active,
                addresses: (editPartner.addresses ?? []).map((a) => ({
                    address_type: a.address_type,
                    full_address: a.full_address,
                    is_default: a.is_default,
                })),
            });
        } else {
            reset({
                name: "",
                type: "CUSTOMER",
                tax_code: "",
                company_name: "",
                bank_account: "",
                contact_person: "",
                phone: "",
                email: "",
                is_active: true,
                addresses: [],
            });
        }
    }, [editPartner, reset]);

    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    const onSubmit = async (data: PartnerFormData) => {
        setErrorMsg(null);
        try {
            if (isEdit && editPartner) {
                await updateMutation.mutateAsync({ id: editPartner.id, ...data } as Parameters<typeof updateMutation.mutateAsync>[0]);
            } else {
                await createMutation.mutateAsync(data);
            }
            onOpenChange(false);
            reset();
        } catch (err: unknown) {
            setErrorMsg(getApiErrorMessage(err, t, isEdit ? "errors.updatePartnerFailed" : "errors.createPartnerFailed"));
        }
    };

    const currentType = watch("type");

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setErrorMsg(null); } onOpenChange(v); }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t("partners.editTitle") : t("partners.addTitle")}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {errorMsg && (
                        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                            {errorMsg}
                        </div>
                    )}

                    {/* Name + Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>{t("partners.fields.name")} *</Label>
                            <Input {...register("name")} placeholder={t("partners.fields.namePlaceholder")} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>{t("partners.fields.type")} *</Label>
                            <Select value={currentType} onValueChange={(v) => setValue("type", v as PartnerType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PARTNER_TYPES.map((pt) => (
                                        <SelectItem key={pt} value={pt}>
                                            {t(`partners.types.${pt}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
                        </div>
                    </div>

                    {/* Company Name + Tax Code */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>{t("partners.fields.companyName")}</Label>
                            <Input {...register("company_name")} placeholder={t("partners.fields.companyNamePlaceholder")} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("partners.fields.taxCode")}</Label>
                            <Input {...register("tax_code")} placeholder={t("partners.fields.taxCodePlaceholder")} />
                        </div>
                    </div>

                    {/* Contact Person + Phone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>{t("partners.fields.contactPerson")}</Label>
                            <Input {...register("contact_person")} placeholder={t("partners.fields.contactPersonPlaceholder")} />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("partners.fields.phone")}</Label>
                            <Input {...register("phone")} placeholder={t("partners.fields.phonePlaceholder")} />
                        </div>
                    </div>

                    {/* Email + Bank Account */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>{t("partners.fields.email")}</Label>
                            <Input {...register("email")} type="email" placeholder={t("partners.fields.emailPlaceholder")} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>{t("partners.fields.bankAccount")}</Label>
                            <Input {...register("bank_account")} placeholder={t("partners.fields.bankAccountPlaceholder")} />
                        </div>
                    </div>

                    {/* Active Status (edit only) */}
                    {isEdit && (
                        <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                                id="partner-is-active"
                                checked={watch("is_active")}
                                onCheckedChange={(checked) => setValue("is_active", !!checked)}
                            />
                            <Label htmlFor="partner-is-active" className="cursor-pointer">
                                {t("partners.fields.isActive")}
                            </Label>
                        </div>
                    )}

                    {/* Addresses Section */}
                    <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">{t("partners.addresses.title")}</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 h-7"
                                onClick={() => append({ address_type: "SHIPPING", full_address: "", is_default: false })}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t("partners.addresses.add")}
                            </Button>
                        </div>

                        {fields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-3">
                                {t("partners.addresses.empty")}
                            </p>
                        )}

                        {fields.map((field, index) => (
                            <div key={field.id} className="border rounded-md p-3 space-y-3 bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {t("partners.addresses.addressLabel", { index: index + 1 })}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-destructive hover:text-destructive"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Address Type */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">{t("partners.addresses.type")}</Label>
                                        <Select
                                            value={watch(`addresses.${index}.address_type`)}
                                            onValueChange={(v) => setValue(`addresses.${index}.address_type`, v as AddressType)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ADDRESS_TYPES.map((at) => (
                                                    <SelectItem key={at} value={at}>
                                                        {t(`partners.addressTypes.${at}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Full Address */}
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs">{t("partners.addresses.fullAddress")}</Label>
                                        <Input
                                            {...register(`addresses.${index}.full_address`)}
                                            placeholder={t("partners.addresses.fullAddressPlaceholder")}
                                            className="h-8 text-xs"
                                        />
                                        {errors.addresses?.[index]?.full_address && (
                                            <p className="text-xs text-destructive">
                                                {errors.addresses[index]?.full_address?.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Is Default */}
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id={`addr-default-${index}`}
                                        checked={watch(`addresses.${index}.is_default`)}
                                        onCheckedChange={(checked) => setValue(`addresses.${index}.is_default`, !!checked)}
                                    />
                                    <Label htmlFor={`addr-default-${index}`} className="text-xs cursor-pointer">
                                        {t("partners.addresses.isDefault")}
                                    </Label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                            {isSubmitting ? t("common.loading") : isEdit ? t("common.save") : t("common.create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
