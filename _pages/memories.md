---
layout: page
title: memories
permalink: /memories/
description: A collection of moments, places, and people that shaped my journey.
nav: true
nav_order: 6
---

<div class="memories-page">

  <!-- Page header -->
  <div class="memories-header">
    <p class="memories-intro">
      A living album of moments that matter — field days, milestones, travels, and the quiet scenes in between.
    </p>
  </div>

  <!-- Filter tags -->
  <div class="memories-filters" id="memoriesFilters">
    <button class="memory-filter-btn active" data-filter="all">All</button>
    <button class="memory-filter-btn" data-filter="photo"><i class="fas fa-camera"></i> Photos</button>
    <button class="memory-filter-btn" data-filter="video"><i class="fas fa-film"></i> Videos</button>
    <button class="memory-filter-btn" data-filter="fieldwork">Fieldwork</button>
    <button class="memory-filter-btn" data-filter="lab">Lab</button>
    <button class="memory-filter-btn" data-filter="conference">Conference</button>
    <button class="memory-filter-btn" data-filter="milestone">Milestone</button>
  </div>

  <!-- Memory grid -->
  <div class="memories-grid" id="memoriesGrid">
    {%- assign sorted_memories = site.data.memories | sort: "date" | reverse -%}
    {%- for memory in sorted_memories -%}
    <div class="memory-card" data-type="{{ memory.type }}" data-tags="{{ memory.tags | join: ' ' }}">

      <!-- Media -->
      <div class="memory-media">
        {%- if memory.type == "video" -%}
        <div class="memory-video-wrapper">
          <iframe
            src="{{ memory.video }}"
            title="{{ memory.title }}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
          <div class="memory-type-badge video-badge"><i class="fas fa-play-circle"></i></div>
        </div>
        {%- else -%}
        <div class="memory-img-wrapper">
          <img
            src="{{ memory.image | relative_url }}"
            alt="{{ memory.title }}"
            class="memory-img"
            data-zoomable
            onerror="this.onerror=null; this.parentElement.classList.add('img-placeholder');"
          />
          <div class="memory-type-badge photo-badge"><i class="fas fa-camera"></i></div>
        </div>
        {%- endif -%}
      </div>

      <!-- Content -->
      <div class="memory-content">
        <div class="memory-meta">
          <time class="memory-date">{{ memory.date | date: "%B %Y" }}</time>
          {%- if memory.tags -%}
          <div class="memory-tags">
            {%- for tag in memory.tags -%}
            <span class="memory-tag">{{ tag }}</span>
            {%- endfor -%}
          </div>
          {%- endif -%}
        </div>
        <h3 class="memory-title">{{ memory.title }}</h3>
        <p class="memory-description">{{ memory.description }}</p>
      </div>

    </div>
    {%- endfor -%}
  </div>

  <!-- Empty state -->
  <div class="memories-empty" id="memoriesEmpty" style="display:none;">
    <i class="fas fa-photo-video"></i>
    <p>No memories found for this filter.</p>
  </div>

</div>

<script>
(function () {
  var filterBtns = document.querySelectorAll('.memory-filter-btn');
  var cards = document.querySelectorAll('.memory-card');
  var emptyState = document.getElementById('memoriesEmpty');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      // Filter cards
      var visible = 0;
      cards.forEach(function (card) {
        var type = card.getAttribute('data-type');
        var tags = card.getAttribute('data-tags');
        var show = filter === 'all' || type === filter || tags.indexOf(filter) !== -1;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      emptyState.style.display = visible === 0 ? 'flex' : 'none';
    });
  });
})();
</script>
