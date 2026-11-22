import {
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  RefreshCw,
  ScrollText,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingPanel,
  Modal,
  PageHeader,
  inputClass,
} from '../components/ui.tsx'
import { errorMessage, getAuditLogById, getAuditLogs, getFieldErrors } from '../lib/api.ts'
import {
  actionLabel,
  actionTone,
  auditActionOptions,
  auditTargetOptions,
  describeMetadata,
  formatMetadata,
  targetLabel,
} from '../lib/audit.ts'
import { formatDateTime } from '../lib/format.ts'
import type { AuditLog, AuditLogList, AuditLogPagination } from '../types/auditLog.ts'

const PAGE_SIZE = 20

interface FilterDraft {
  action: string
  targetTable: string
  targetId: string
  userId: string
  from: string
  to: string
}

const emptyFilters: FilterDraft = {
  action: '',
  targetTable: '',
  targetId: '',
  userId: '',
  from: '',
  to: '',
}

const emptyPagination: AuditLogPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

export function AuditLogPage() {
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(emptyFilters)
  const [filters, setFilters] = useState<FilterDraft>(emptyFilters)
  const [page, setPage] = useState(1)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] =
    useState<AuditLogPagination>(emptyPagination)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const openDetail = (id: number) => {
    setSelectedLogId(id)
    setDetailLog(null)
    setIsLoadingDetail(true)
    setDetailError(null)

    getAuditLogById(id)
      .then((data) => {
        setDetailLog(data)
      })
      .catch((err: unknown) => {
        setDetailError(errorMessage(err))
      })
      .finally(() => {
        setIsLoadingDetail(false)
      })
  }

  const closeDetail = () => {
    setSelectedLogId(null)
    setDetailLog(null)
    setDetailError(null)
  }

  useEffect(() => {
    let active = true

    getAuditLogs({
      page,
      pageSize: PAGE_SIZE,
      action: filters.action || undefined,
      targetTable: filters.targetTable || undefined,
      targetId: filters.targetId ? Number(filters.targetId) : undefined,
      userId: filters.userId ? Number(filters.userId) : undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    })
      .then((data: AuditLogList) => {
        if (!active) return

        setLogs(data.items)
        setPagination(data.pagination)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (!active) return

        const fieldMessage = Object.values(getFieldErrors(loadError))[0]

        setError(fieldMessage ?? errorMessage(loadError))
        setLogs([])
        setPagination(emptyPagination)
      })
      .finally(() => {
        if (!active) return

        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters, page, reloadToken])

  const refresh = () => {
    setReloadToken((token) => token + 1)
  }

  const retry = () => {
    setIsLoading(true)
    setReloadToken((token) => token + 1)
  }

  const applyFilters = () => {
    setIsLoading(true)
    setFilters({ ...draftFilters })
    setPage(1)
  }

  const resetFilters = () => {
    setIsLoading(true)
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
    setReloadToken((token) => token + 1)
  }

  const goToPage = (nextPage: number) => {
    setIsLoading(true)
    setPage(nextPage)
    setReloadToken((token) => token + 1)
  }

  return (
    <div>
      <PageHeader
          eyebrow="Admin"
          title="Riwayat Audit"
          description="Jejak aktivitas login, perubahan menu, pembuatan pesanan, dan perubahan status pesanan. Catatan audit tidak dapat diubah atau dihapus dari aplikasi."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={refresh}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Segarkan
              </Button>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-text-muted">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Khusus admin
              </span>
            </div>
          }
        />

        <Card className="mb-4 p-4">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
            onSubmit={(event) => {
              event.preventDefault()
              applyFilters()
            }}
          >
            <label className="block text-xs font-semibold text-text-muted">
              Aksi
              <select
                className={`${inputClass} mt-1`}
                value={draftFilters.action}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    action: event.target.value,
                  }))
                }
              >
                <option value="">Semua aksi</option>
                {auditActionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-text-muted">
              Target
              <select
                className={`${inputClass} mt-1`}
                value={draftFilters.targetTable}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    targetTable: event.target.value,
                  }))
                }
              >
                <option value="">Semua target</option>
                {auditTargetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-text-muted">
              User ID
              <input
                type="number"
                min="1"
                placeholder="cth: 1"
                className={`${inputClass} mt-1`}
                value={draftFilters.userId}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    userId: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block text-xs font-semibold text-text-muted">
              Target ID
              <input
                type="number"
                min="1"
                placeholder="cth: 5"
                className={`${inputClass} mt-1`}
                value={draftFilters.targetId}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    targetId: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block text-xs font-semibold text-text-muted">
              Dari tanggal
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={draftFilters.from}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block text-xs font-semibold text-text-muted">
              Sampai tanggal
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={draftFilters.to}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
              />
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1">
                Terapkan
              </Button>
              <Button variant="secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </form>
        </Card>

        {error ? (
          <div className="mb-4">
            <Alert tone="error" title="Riwayat audit belum bisa dimuat">
              <div className="flex flex-wrap items-center gap-2">
                <span>{error}</span>
                <Button variant="secondary" onClick={retry}>
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Coba lagi
                </Button>
              </div>
            </Alert>
          </div>
        ) : isLoading ? (
          <LoadingPanel message="Memuat riwayat audit..." />
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Total catatan
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {pagination.total}
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Di halaman ini
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {logs.length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Halaman
                </p>
                <p className="m-0 text-2xl font-extrabold text-primary-dark">
                  {pagination.totalPages === 0 ? 0 : pagination.page} /{' '}
                  {pagination.totalPages}
                </p>
              </Card>
            </div>

            {logs.length === 0 ? (
              <EmptyState
                icon={History}
                title="Belum ada aktivitas"
                message="Catatan akan muncul setelah ada login, perubahan menu, atau pesanan yang dibuat."
              />
            ) : (
              <>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/60 text-[11px] uppercase tracking-wider text-text-muted">
                      <th scope="col" className="px-4 py-3 font-bold">
                        Waktu
                      </th>
                      <th scope="col" className="px-4 py-3 font-bold">
                        Aksi
                      </th>
                      <th scope="col" className="px-4 py-3 font-bold">
                        Target
                      </th>
                      <th scope="col" className="px-4 py-3 font-bold">
                        Pengguna
                      </th>
                      <th scope="col" className="px-4 py-3 font-bold">
                        Ringkasan
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/70 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={actionTone(log.action)}>
                            {actionLabel(log.action)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">
                            {targetLabel(log.targetTable)}
                          </span>
                          {log.targetId !== null ? (
                            <span className="ml-1 font-mono text-xs text-text-muted">
                              #{log.targetId}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="block font-semibold">
                            {log.userName ?? 'Sistem'}
                          </span>
                          {log.userEmail ? (
                            <span className="block text-xs text-text-muted">
                              {log.userEmail}
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-64 px-4 py-3 text-xs text-text-muted">
                          {describeMetadata(log.metadata)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            className="min-h-8 px-2.5 text-xs"
                            onClick={() => openDetail(log.id)}
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                            Lihat
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-xs text-text-muted">
                Menampilkan {logs.length} dari {pagination.total} catatan
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="min-h-8 px-2.5 text-xs"
                  disabled={page <= 1 || isLoading}
                  onClick={() => goToPage(Math.max(1, page - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Sebelumnya
                </Button>
                <span className="text-xs font-semibold text-text-muted">
                  Halaman {pagination.totalPages === 0 ? 0 : pagination.page}{' '}
                  dari {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  className="min-h-8 px-2.5 text-xs"
                  disabled={page >= pagination.totalPages || isLoading}
                  onClick={() => goToPage(page + 1)}
                >
                  Berikutnya
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
              </>
            )}
          </>
        )}

      {selectedLogId !== null ? (
        <Modal
          title={`Detail Audit #${selectedLogId}`}
          onClose={closeDetail}
          footer={
            <Button variant="secondary" onClick={closeDetail}>
              Tutup
            </Button>
          }
        >
          {isLoadingDetail ? (
            <LoadingPanel message="Mengambil data detail audit dari server..." />
          ) : detailError ? (
            <Alert tone="error">{detailError}</Alert>
          ) : detailLog ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-control border border-dashed border-border bg-surface-muted/50 p-3">
                <ScrollText className="size-4 text-primary" aria-hidden="true" />
                <Badge tone={actionTone(detailLog.action)}>
                  {actionLabel(detailLog.action)}
                </Badge>
                <span className="text-xs text-text-muted">
                  {targetLabel(detailLog.targetTable)}
                  {detailLog.targetId !== null
                    ? ` #${detailLog.targetId}`
                    : ''}
                </span>
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-text-muted">Waktu</dt>
                  <dd className="m-0 font-semibold">
                    {formatDateTime(detailLog.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Pelaku</dt>
                  <dd className="m-0 font-semibold">
                    {detailLog.userName ?? 'Sistem'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Email</dt>
                  <dd className="m-0 font-semibold">
                    {detailLog.userEmail ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">User ID</dt>
                  <dd className="m-0 font-semibold">
                    {detailLog.userId ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">IP Address</dt>
                  <dd className="m-0 font-mono text-xs font-semibold">
                    {(detailLog.metadata as any)?.ip_address ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Status / Hasil</dt>
                  <dd className="m-0 font-semibold">
                    {(detailLog.metadata as any)?.result ?? '-'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-text-muted">User Agent</dt>
                  <dd className="m-0 font-mono text-xs break-all text-text-muted">
                    {(detailLog.metadata as any)?.user_agent ?? '-'}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  Metadata Lengkap
                </p>
                <pre className="m-0 max-h-72 overflow-auto rounded-control bg-surface-muted p-3 text-xs leading-relaxed text-text">
                  {formatMetadata(detailLog.metadata)}
                </pre>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}
