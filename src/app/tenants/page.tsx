"use client";

import { useState, useEffect } from "react";

import { tenants } from "@/lib/api";
import type { TenantDto } from "@/types";
import { useToast } from "@/context/toast-context";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField, { inputClass, btnPrimary, btnSecondary } from "@/components/FormField";

const emptyForm = { name: "", address: "", slug: "", apiKey: "" };

export default function TenantsPage() {
  const [data, setData] = useState<TenantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TenantDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<TenantDto | null>(null);
  const [saving, setSaving] = useState(false);
  const { showError } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await tenants.getAll();
      setData(result);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tenant: TenantDto) => {
    setEditing(tenant);
    setForm({
      name: tenant.name ?? "",
      address: tenant.address ?? "",
      slug: tenant.slug ?? "",
      apiKey: tenant.apiKey ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name || null,
        address: form.address || null,
        slug: form.slug || null,
        apiKey: form.apiKey,
      };

      if (editing) {
        await tenants.update(editing.id, { id: editing.id, ...payload });
      } else {
        await tenants.create(payload);
      }

      closeModal();
      await fetchData();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await tenants.delete(confirmDelete.id);
      setConfirmDelete(null);
      await fetchData();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "address", header: "Address" },
    { key: "slug", header: "Slug" },
    {
      key: "apiKey",
      header: "API Key",
      render: (t: TenantDto) =>
        t.apiKey ? (
          <span className="font-mono text-xs text-gray-500">
            {t.apiKey.substring(0, 8)}...
          </span>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Manage tenant accounts and API keys"
        action={
          <button className={btnPrimary} onClick={openCreate}>
            Add Tenant
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={openEdit}
        onDelete={(t) => setConfirmDelete(t)}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Tenant" : "Add Tenant"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tenant name"
            />
          </FormField>

          <FormField label="Address">
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Tenant address"
            />
          </FormField>

          <FormField label="Slug">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="tenant-slug"
            />
          </FormField>

          <FormField label="API Key">
            <input
              className={inputClass}
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={btnSecondary} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Tenant"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete tenant{" "}
          <span className="font-semibold text-gray-900">
            {confirmDelete?.name ?? `#${confirmDelete?.id}`}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className={btnSecondary}
            onClick={() => setConfirmDelete(null)}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
