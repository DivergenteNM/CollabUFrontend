import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmojiPickerComponent } from './emoji-picker.component';

describe('EmojiPickerComponent', () => {
  let component: EmojiPickerComponent;
  let fixture: ComponentFixture<EmojiPickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmojiPickerComponent],
    });
    fixture = TestBed.createComponent(EmojiPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se inicializa correctamente con la categoría por defecto', () => {
    expect(component).toBeTruthy();
    expect(component.categories.length).toBeGreaterThan(0);
  });

  it('permite cambiar de categoría', () => {
    component.setCategory('animals');
    expect(component.activeCategory()).toBe('animals');
    expect(component.currentCategoryData().id).toBe('animals');
  });

  it('emite el emoji seleccionado y lo guarda en recientes', () => {
    let selectedEmoji: string | undefined;
    component.emojiSelect.subscribe((emoji) => {
      selectedEmoji = emoji;
    });

    component.onSelectEmoji('🔥');

    expect(selectedEmoji).toBe('🔥');
    expect(component.recentEmojis()).toContain('🔥');
  });

  it('filtra emojis al ingresar una búsqueda', () => {
    component.onSearchChange('feliz');
    expect(component.isSearching()).toBe(true);
    expect(component.searchResults().length).toBeGreaterThan(0);
    expect(component.searchResults()).toContain('😀');
  });

  it('emite close al llamar onEscape', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    component.onEscape();

    expect(closed).toBe(true);
  });
});
