---
layout: page
permalink: /repos/
title: job trail
description: A chronological trail through research, teaching, and professional roles.
nav: true
nav_order: 3
---

<div class="cv">
{%- for entry in site.data.cv -%}
  {%- if entry.title == "Research Experience" or entry.title == "Professional Experience" or entry.title == "Teaching & Mentoring Experience" -%}
  <div class="card mt-3 p-3">
    <h3 class="card-title font-weight-medium">{{ entry.title }}</h3>
    <div>
      {% include cv/time_table.html %}
    </div>
  </div>
  {%- endif -%}
{%- endfor -%}
</div>

---

### GitHub

{% if site.data.repositories.github_users %}
<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for user in site.data.repositories.github_users %}
    {% include repository/repo_user.html username=user %}
  {% endfor %}
</div>
{% endif %}

{% if site.data.repositories.github_repos %}
<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for repo in site.data.repositories.github_repos %}
    {% include repository/repo.html repository=repo %}
  {% endfor %}
</div>
{% endif %}
