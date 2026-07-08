---
layout: page
title: Automated extraction monitoring
description: Deep learning and satellite/drone imagery for watershed-scale sediment extraction monitoring.
img: assets/img/publications/pub_preview_1.jpg
importance: 2
category: research
---

As part of my dissertation research in the Department of Geography & GIS at the University of Illinois Urbana-Champaign (advisor: **Jim Best**), I am building reproducible tools to track sand and gravel extraction across entire watersheds rather than one site at a time.

The pipeline combines Landsat and Sentinel-2 time series in Google Earth Engine with a spatial AI model (YOLO26, PyTorch, GPU-enabled training) trained on high-resolution Planet imagery to detect and track sediment-transport vessels, generating spatio-temporal extraction-intensity metrics. Grain-size distributions and sediment-budget components from field surveys and pit-volume analysis help constrain extraction rates relative to natural sediment supply, and drone imagery collected in the field is used to train and validate the models. All of the geospatial workflows and code are version-controlled and shareable, so the analysis can be reproduced or extended by field teams and policy partners.

This work was presented as "Quantification of Alluvial Sand Mining in Bangladesh through Detection and Tracking of Sand Transport Vessels" at the AGU Fall Meeting (San Francisco, 2023), with Jim Best, Christopher Hackney, and Marek Smigaj.

I also mentor undergraduate researchers (Roepke Summer Scholars) on building the image-annotation training sets, processing drone imagery, and running qualitative field surveys that ground-truth the remote-sensing results.
