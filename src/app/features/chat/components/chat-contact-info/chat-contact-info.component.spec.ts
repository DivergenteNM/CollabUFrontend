import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChatContactInfoComponent } from './chat-contact-info.component';

describe('ChatContactInfoComponent', () => {
  let component: ChatContactInfoComponent;
  let fixture: ComponentFixture<ChatContactInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatContactInfoComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ChatContactInfoComponent);
    component = fixture.componentInstance;
  });

  it('se inicializa y formatea el rol de estudiante correctamente', () => {
    fixture.componentRef.setInput('participant', {
      userId: 'u-1',
      displayName: 'Ana Gómez',
      role: 'student',
      isOnline: true,
    });
    fixture.detectChanges();

    expect(component.roleLabel()).toBe('Estudiante');
    expect(component.roleIcon()).toBe('school');
  });

  it('extrae archivos compartidos de los mensajes', () => {
    fixture.componentRef.setInput('messages', [
      {
        id: 'm1',
        conversationId: 'c1',
        senderId: 'u-1',
        senderName: 'Ana',
        content: 'Aquí va el reporte',
        messageType: 'file',
        fileUrl: 'https://example.com/reporte.pdf',
        fileName: 'reporte.pdf',
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    fixture.detectChanges();

    expect(component.sharedFiles().length).toBe(1);
    expect(component.sharedFiles()[0].name).toBe('reporte.pdf');
  });

  it('permite alternar el estado de silencio', () => {
    expect(component.isMuted()).toBe(false);
    component.toggleMute();
    expect(component.isMuted()).toBe(true);
  });

  it('emite close al hacer clic en cerrar', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    component.close.emit();
    expect(closed).toBe(true);
  });
});
