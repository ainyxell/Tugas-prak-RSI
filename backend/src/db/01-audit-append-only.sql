-- Trigger untuk melindungi AUDIT_LOGS di level database agar bersifat append-only
-- Menolak perintah UPDATE dan DELETE langsung pada tabel AUDIT_LOGS

CREATE OR ALTER TRIGGER TR_AUDIT_LOGS_AppendOnly 
ON dbo.AUDIT_LOGS 
INSTEAD OF UPDATE, DELETE 
AS 
BEGIN 
    THROW 50010, 'AUDIT_LOGS bersifat append-only.', 1; 
END;
GO
