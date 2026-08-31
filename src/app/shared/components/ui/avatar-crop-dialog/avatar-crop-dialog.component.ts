import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

export interface AvatarCropDialogData {
  imageFile: File;
}

@Component({
  selector: 'app-avatar-crop-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
  ],
  templateUrl: './avatar-crop-dialog.component.html',
  styleUrl: './avatar-crop-dialog.component.scss',
})
export class AvatarCropDialogComponent implements AfterViewInit {
  readonly data = inject<AvatarCropDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AvatarCropDialogComponent>);

  @ViewChild('cropCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  zoomLevel = signal<number>(1);
  isDragging = false;
  startX = 0;
  startY = 0;
  offsetX = 0;
  offsetY = 0;

  private image: HTMLImageElement | null = null;
  private readonly canvasSize = 320;
  private readonly cropRadius = 130;

  ngAfterViewInit(): void {
    if (this.data?.imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.image = img;
          this.resetPosition();
          this.draw();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(this.data.imageFile);
    }
  }

  resetPosition(): void {
    if (!this.image) return;
    const baseScale = Math.max(
      (this.cropRadius * 2) / this.image.width,
      (this.cropRadius * 2) / this.image.height
    );
    this.zoomLevel.set(1);
    this.offsetX = (this.canvasSize - this.image.width * baseScale) / 2;
    this.offsetY = (this.canvasSize - this.image.height * baseScale) / 2;
  }

  onZoomChange(zoom: number): void {
    this.zoomLevel.set(zoom);
    this.draw();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomStep = 0.1;
    const direction = event.deltaY < 0 ? 1 : -1;
    const newZoom = Math.min(Math.max(1, +(this.zoomLevel() + direction * zoomStep).toFixed(2)), 3);
    this.zoomLevel.set(newZoom);
    this.draw();
  }

  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX - this.offsetX;
    this.startY = event.clientY - this.offsetY;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.offsetX = event.clientX - this.startX;
    this.offsetY = event.clientY - this.startY;
    this.draw();
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.startX = event.touches[0].clientX - this.offsetX;
      this.startY = event.touches[0].clientY - this.offsetY;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.offsetX = event.touches[0].clientX - this.startX;
    this.offsetY = event.touches[0].clientY - this.startY;
    this.draw();
  }

  onTouchEnd(): void {
    this.isDragging = false;
  }

  draw(): void {
    if (!this.canvasRef || !this.image) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseScale = Math.max(
      (this.cropRadius * 2) / this.image.width,
      (this.cropRadius * 2) / this.image.height
    );
    const currentScale = baseScale * this.zoomLevel();

    const drawWidth = this.image.width * currentScale;
    const drawHeight = this.image.height * currentScale;

    // Draw full image
    ctx.save();
    ctx.drawImage(this.image, this.offsetX, this.offsetY, drawWidth, drawHeight);
    ctx.restore();

    // Draw dark semi-transparent overlay outside circular crop area
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(canvas.width / 2, canvas.height / 2, this.cropRadius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Draw circular border
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, this.cropRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  cropAndSave(): void {
    if (!this.image) {
      this.dialogRef.close(null);
      return;
    }

    const outputCanvas = document.createElement('canvas');
    const outputSize = 400; // Output dimension for high-quality circular avatar
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) {
      this.dialogRef.close(null);
      return;
    }

    const baseScale = Math.max(
      (this.cropRadius * 2) / this.image.width,
      (this.cropRadius * 2) / this.image.height
    );
    const currentScale = baseScale * this.zoomLevel();

    // Calculate source rect from canvas coordinates
    const centerX = this.canvasSize / 2;
    const centerY = this.canvasSize / 2;

    const sourceCropLeft = (centerX - this.cropRadius - this.offsetX) / currentScale;
    const sourceCropTop = (centerY - this.cropRadius - this.offsetY) / currentScale;
    const sourceCropSize = (this.cropRadius * 2) / currentScale;

    // Draw cropped region onto output canvas with circular mask
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      this.image,
      sourceCropLeft,
      sourceCropTop,
      sourceCropSize,
      sourceCropSize,
      0,
      0,
      outputSize,
      outputSize
    );

    outputCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], `avatar-${Date.now()}.png`, {
          type: 'image/png',
        });
        this.dialogRef.close(croppedFile);
      } else {
        this.dialogRef.close(null);
      }
    }, 'image/png');
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
