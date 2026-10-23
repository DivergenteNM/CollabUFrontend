import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Evaluation } from '../../../../core/models';
import { PublicReviewsStats } from '../../../../features/evaluations/services/evaluation.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-profile-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    StarRatingComponent,
  ],
  templateUrl: './profile-reviews.component.html',
  styleUrl: './profile-reviews.component.scss',
})
export class ProfileReviewsComponent {
  readonly evaluations = input<Evaluation[]>([]);
  readonly stats = input<PublicReviewsStats | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly title = input<string>('Reseñas y Evaluaciones');
  readonly subtitle = input<string>(
    'Comentarios y valoraciones dejadas por estudiantes y tutores al culminar sus proyectos',
  );
  readonly emptyTitle = input<string>('Sin reseñas todavía');
  readonly emptyMessage = input<string>(
    'Aún no cuenta con evaluaciones registradas. Las reseñas y calificaciones se publican automáticamente cuando concluye el ciclo de evaluación de un proyecto.',
  );

  readonly displayLimit = signal<number>(5);

  readonly totalReviews = computed(() => {
    return this.stats()?.totalReviews ?? this.evaluations()?.length ?? 0;
  });

  readonly averageRating = computed(() => {
    const fromStats = this.stats()?.averageRating;
    if (fromStats !== undefined && fromStats !== null) return fromStats;
    const evals = this.evaluations() || [];
    const withScore = evals.filter((e) => e.overallScore !== null && e.overallScore !== undefined);
    if (withScore.length === 0) return null;
    const avg = withScore.reduce((sum, e) => sum + Number(e.overallScore), 0) / withScore.length;
    return Math.round((avg / 20) * 10) / 10;
  });

  readonly hasReviews = computed(() => (this.evaluations()?.length ?? 0) > 0);

  readonly visibleReviews = computed(() => {
    const list = this.evaluations() || [];
    return list.slice(0, this.displayLimit());
  });

  readonly canShowMore = computed(() => {
    return (this.evaluations()?.length ?? 0) > this.displayLimit();
  });

  readonly starDistribution = computed(() => {
    const dist = this.stats()?.distribution || {};
    const total = this.totalReviews() || 1;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = dist[stars] ?? 0;
      const percentage = Math.min(100, Math.round((count / total) * 100));
      return { stars, count, percentage };
    });
  });

  showMore(): void {
    this.displayLimit.update((cur) => cur + 5);
  }

  getScoreStars(overallScore: number | null | undefined): number {
    if (overallScore === null || overallScore === undefined) return 5;
    return Math.round((Number(overallScore) / 20) * 10) / 10;
  }

  getInitials(name?: string | null): string {
    if (!name?.trim()) return 'ES';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
