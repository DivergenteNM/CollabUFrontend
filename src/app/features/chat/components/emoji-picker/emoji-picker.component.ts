import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  output,
  OnInit,
  HostListener,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  EMOJI_CATEGORIES,
  EMOJI_SEARCH_MAP,
  EmojiCategory,
} from './emoji-data';

const RECENT_EMOJIS_KEY = 'collabu_recent_emojis';
const MAX_RECENT_EMOJIS = 32;

@Component({
  selector: 'app-emoji-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
})
export class EmojiPickerComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);

  readonly emojiSelect = output<string>();
  readonly close = output<void>();

  readonly categories: EmojiCategory[] = EMOJI_CATEGORIES;
  readonly activeCategory = signal<string>('smileys');
  readonly searchQuery = signal<string>('');
  readonly recentEmojis = signal<string[]>([]);

  readonly currentCategoryData = computed(() => {
    const active = this.activeCategory();
    if (active === 'recent') {
      return {
        id: 'recent',
        name: 'Recientes',
        icon: 'schedule',
        emojis: this.recentEmojis(),
      };
    }
    return this.categories.find(c => c.id === active) ?? this.categories[0];
  });

  readonly searchResults = computed<string[]>(() => {
    const rawQuery = this.searchQuery().trim().toLowerCase();
    if (!rawQuery) return [];

    const matched = new Set<string>();
    for (const entry of EMOJI_SEARCH_MAP) {
      if (
        entry.emoji.includes(rawQuery) ||
        entry.keywords.some(k => k.toLowerCase().includes(rawQuery))
      ) {
        matched.add(entry.emoji);
      }
    }
    return Array.from(matched);
  });

  readonly isSearching = computed(() => this.searchQuery().trim().length > 0);

  ngOnInit(): void {
    this.loadRecentEmojis();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      // Clik outside
      this.close.emit();
    }
  }

  setCategory(categoryId: string): void {
    this.searchQuery.set('');
    this.activeCategory.set(categoryId);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onSelectEmoji(emoji: string): void {
    this.saveRecentEmoji(emoji);
    this.emojiSelect.emit(emoji);
  }

  private loadRecentEmojis(): void {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.recentEmojis.set(parsed);
          this.activeCategory.set('recent');
          return;
        }
      }
    } catch {
      // Fallback
    }
    this.activeCategory.set('smileys');
  }

  private saveRecentEmoji(emoji: string): void {
    const current = this.recentEmojis().filter(e => e !== emoji);
    const updated = [emoji, ...current].slice(0, MAX_RECENT_EMOJIS);
    this.recentEmojis.set(updated);
    try {
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    } catch {
      // Quota exceeded or private browsing
    }
  }
}
