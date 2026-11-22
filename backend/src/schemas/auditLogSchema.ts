import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateStr: string): boolean {
  if (!dateRegex.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const auditLogQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => Number(val))
      .refine((val) => Number.isInteger(val) && val >= 1, {
        message: 'page harus bilangan bulat minimal 1',
      }),
    pageSize: z
      .string()
      .optional()
      .default('20')
      .transform((val) => Number(val))
      .refine((val) => Number.isInteger(val) && val >= 1 && val <= 100, {
        message: 'pageSize harus antara 1 sampai 100',
      }),
    action: z
      .string()
      .max(50, 'action maksimal 50 karakter')
      .optional(),
    targetTable: z
      .string()
      .max(50, 'targetTable maksimal 50 karakter')
      .optional(),
    targetId: z
      .string()
      .optional()
      .transform((val) => (val !== undefined && val !== '' ? Number(val) : undefined))
      .refine((val) => val === undefined || (Number.isInteger(val) && val >= 1), {
        message: 'targetId harus bilangan bulat positif',
      }),
    userId: z
      .string()
      .optional()
      .transform((val) => (val !== undefined && val !== '' ? Number(val) : undefined))
      .refine((val) => val === undefined || (Number.isInteger(val) && val >= 1), {
        message: 'userId harus bilangan bulat positif',
      }),
    from: z
      .string()
      .refine((val) => isValidDate(val), {
        message: "from harus berupa tanggal valid dengan format YYYY-MM-DD",
      })
      .optional(),
    to: z
      .string()
      .refine((val) => isValidDate(val), {
        message: "to harus berupa tanggal valid dengan format YYYY-MM-DD",
      })
      .optional(),
  })
  .strict({ message: 'Parameter query tidak dikenal' })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return data.from <= data.to;
      }
      return true;
    },
    {
      message: "Tanggal 'from' tidak boleh lebih besar dari 'to'",
      path: ['from'],
    },
  );

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
