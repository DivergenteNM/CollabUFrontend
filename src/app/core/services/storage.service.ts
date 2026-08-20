import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ApiResponse } from '../models';

/** Metadatos de un archivo almacenado, tal como los devuelve Storage Service. */
export interface StoredFileInfo {
  id: string;
  ownerId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSizeBytes: number;
  category: string;
  entityType: string | null;
  entityId: string | null;
  publicUrl: string | null;
  isPublic: boolean;
  version: number;
  createdAt: string;
  versions?: { id: string; version: number; createdAt: string; changeNote: string | null }[];
}

/** Motivo por el que un archivo no pudo obtenerse, para distinguirlo de "no hay archivo". */
export type FileErrorReason = 'not_found' | 'forbidden' | 'missing_on_disk' | 'unknown';

export class FileAccessError extends Error {
  constructor(readonly reason: FileErrorReason, message: string) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class StorageService extends BaseApiService {
  protected readonly basePath = '/storage';

  upload(file: File, category: string, isPublic = false): Observable<ApiResponse<{ fileId: string; url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (isPublic) {
      formData.append('isPublic', 'true');
    }
    return this.http.post<any>(`${this.apiUrl}/upload`, formData).pipe(
      map((res: any) => {
        const raw = res?.data ?? res;
        const fileId = raw.id ?? raw.fileId;
        // Storage devuelve publicUrl solo para archivos con isPublic=true.
        // Para archivos privados (todos los del flujo académico) construimos
        // la URL del endpoint autenticado, así el caller puede pasarla como
        // fileUrl sin quedar en null y el interceptor añade el Bearer.
        const url =
          raw.publicUrl
          ?? raw.url
          ?? (fileId ? `/api/v1/storage/files/${fileId}/download` : '');
        return { data: { fileId, url } } as ApiResponse<{ fileId: string; url: string }>;
      }),
    );
  }

  /**
   * Metadatos del archivo. Storage Service delega la autorización en el servicio
   * dueño de la entidad, así que un jurado obtiene los datos del anteproyecto que
   * revisa aunque no sea el propietario.
   */
  getFileInfo(fileId: string): Observable<StoredFileInfo> {
    return this.http
      .get<StoredFileInfo | ApiResponse<StoredFileInfo>>(`${this.apiUrl}/files/${fileId}`)
      .pipe(
        map((res) => (res && 'data' in res ? (res as ApiResponse<StoredFileInfo>).data! : (res as StoredFileInfo))),
        catchError((err: HttpErrorResponse) => throwError(() => toFileAccessError(err))),
      );
  }

  /**
   * Descarga el archivo como blob.
   *
   * La ruta exige autenticación desde la corrección de permisos, así que no puede
   * usarse un `<a href>` directo: el navegador no enviaría la cabecera Authorization.
   * El interceptor la añade a esta petición.
   */
  downloadBlob(fileId: string): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/files/${fileId}/download`, { responseType: 'blob' })
      .pipe(catchError((err: HttpErrorResponse) => throwError(() => toFileAccessError(err))));
  }

  /**
   * URL temporal utilizable en `<a href>`, `<img src>` o un visor embebido.
   * Quien la reciba debe liberarla con `revokeObjectUrl` al terminar.
   */
  getObjectUrl(fileId: string): Observable<string> {
    return this.downloadBlob(fileId).pipe(map((blob) => URL.createObjectURL(blob)));
  }

  revokeObjectUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /** Descarga el archivo y dispara el guardado en el navegador. */
  saveAs(fileId: string, fileName: string): Observable<void> {
    return this.downloadBlob(fileId).pipe(
      map((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }),
    );
  }

  /** URL firmada de duración limitada, para compartir fuera de la aplicación. */
  getSignedUrl(fileId: string, expiresInMinutes = 60): Observable<{ url: string; expiresAt: string }> {
    return this.http.post<{ url: string; expiresAt: string }>(
      `${this.apiUrl}/files/${fileId}/signed-url`,
      { expiresInMinutes },
    );
  }

  getQuota(): Observable<ApiResponse<{ usedBytes: number; totalBytes: number; percentage: number }>> {
    return this.http.get<ApiResponse<{ usedBytes: number; totalBytes: number; percentage: number }>>(`${this.apiUrl}/quota`);
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${fileId}`);
  }
}

/**
 * Traduce el error HTTP a un motivo accionable.
 *
 * El backend usa 404 tanto para "no existe el registro" como para "el registro
 * existe pero el binario no está en disco" — el segundo caso es habitual con
 * datos sembrados y merece un mensaje distinto.
 */
function toFileAccessError(err: HttpErrorResponse): FileAccessError {
  if (err.status === 403) {
    return new FileAccessError('forbidden', 'No tienes permiso para ver este archivo');
  }
  if (err.status === 404) {
    const message = typeof err.error?.message === 'string' ? err.error.message : '';
    if (message.includes('físico')) {
      return new FileAccessError('missing_on_disk', 'El archivo no está disponible en el servidor');
    }
    return new FileAccessError('not_found', 'El archivo no existe');
  }
  return new FileAccessError('unknown', 'No se pudo obtener el archivo');
}
