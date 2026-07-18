import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';

export interface KbChapter {
  id: string;
  index: number; // 1-19
  title: string;
  group: string;
}

// The knowledge base's 19 chapters, exactly as listed in its own nav
// sidebar (public/adhd-knowledge-base.html lines 311-335) — used both for
// the native panel's own nav and for step 45's daily micro-lesson cycle.
export const KB_CHAPTERS: KbChapter[] = [
  { id: 'definition', index: 1, title: "What ADHD is & how it's defined", group: 'Foundations' },
  { id: 'epidemiology', index: 2, title: 'Epidemiology & prevalence', group: 'Foundations' },
  { id: 'genetics', index: 3, title: 'Genetics & heritability', group: 'Foundations' },
  { id: 'neuroanatomy', index: 4, title: 'Neuroanatomy & structure', group: 'The physical & chemical brain' },
  { id: 'networks', index: 5, title: 'Brain networks & connectivity', group: 'The physical & chemical brain' },
  { id: 'neurochemistry', index: 6, title: 'Neurotransmitter systems', group: 'The physical & chemical brain' },
  { id: 'executive', index: 7, title: 'Executive function models', group: 'The physical & chemical brain' },
  { id: 'hormones', index: 8, title: 'Hormones & endocrine axes', group: 'The hormonal brain' },
  { id: 'sex-lifespan', index: 9, title: 'Sex differences & lifespan', group: 'The hormonal brain' },
  { id: 'comorbidity', index: 10, title: 'Comorbidities & overlap', group: 'Context & comorbidity' },
  { id: 'modern', index: 11, title: 'The modern digital trap', group: 'Context & comorbidity' },
  { id: 'pharmacology', index: 12, title: 'Pharmacology in depth', group: 'Interventions' },
  { id: 'behavioural', index: 13, title: 'Behavioural & psychosocial', group: 'Interventions' },
  { id: 'cheatcodes', index: 14, title: 'Science-backed cheatcodes', group: 'Interventions' },
  { id: 'targeted', index: 15, title: 'Targeted fixes: symptom by symptom', group: 'Interventions' },
  { id: 'comorbid-fixes', index: 16, title: 'Targeted fixes: comorbidities', group: 'Interventions' },
  { id: 'myths', index: 17, title: 'Myths vs facts', group: 'Reference' },
  { id: 'glossary', index: 18, title: 'Glossary', group: 'Reference' },
  { id: 'references', index: 19, title: 'References & caveats', group: 'Reference' }
];

@Injectable({
  providedIn: 'root'
})
export class KbService {
  // Cache the parsed <main> content in memory so re-opening the panel
  // doesn't re-fetch/re-parse the ~1500-line source file every time.
  private sectionsHtml$?: Observable<Map<string, string>>;

  constructor(private http: HttpClient) {}

  // Fetches the static KB HTML and extracts each <section id="..."> as its
  // own HTML fragment, keyed by section id — this is what "served
  // natively" means here: the actual authored content, parsed out of its
  // standalone-page wrapper and injected into the app's own DOM, not an
  // iframe pointing at a separate document.
  getSectionsHtml(): Observable<Map<string, string>> {
    if (!this.sectionsHtml$) {
      this.sectionsHtml$ = this.http.get('adhd-knowledge-base.html', { responseType: 'text' }).pipe(
        map((raw) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(raw, 'text/html');
          const map = new Map<string, string>();
          KB_CHAPTERS.forEach((chapter) => {
            const el = doc.getElementById(chapter.id);
            if (el) {
              map.set(chapter.id, el.innerHTML);
            }
          });
          return map;
        }),
        shareReplay(1)
      );
    }
    return this.sectionsHtml$;
  }

  getChapter(id: string): KbChapter | undefined {
    return KB_CHAPTERS.find(c => c.id === id);
  }
}
