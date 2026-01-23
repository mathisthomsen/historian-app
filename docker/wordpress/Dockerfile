FROM wordpress:php8.2-fpm

# Install dependencies for wkhtmltopdf
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    xvfb \
    xfonts-base \
    xfonts-75dpi \
    fontconfig \
    libxrender1 \
    libxext6 \
    libjpeg62-turbo \
    ca-certificates \
    binutils \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install libssl1.1 from Debian archive (required by wkhtmltopdf)
RUN echo "deb http://deb.debian.org/debian bullseye main" > /etc/apt/sources.list.d/bullseye.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends libssl1.1 && \
    rm /etc/apt/sources.list.d/bullseye.list && \
    rm -rf /var/lib/apt/lists/*

# Download and install wkhtmltopdf static binary
RUN wget -q -O /tmp/wkhtmltox.deb https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-2/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb && \
    cd /tmp && \
    ar x wkhtmltox.deb data.tar.xz && \
    tar -xf data.tar.xz && \
    cp usr/local/bin/wkhtmltopdf /usr/local/bin/ && \
    chmod +x /usr/local/bin/wkhtmltopdf && \
    cp usr/local/bin/wkhtmltoimage /usr/local/bin/ 2>/dev/null || true && \
    chmod +x /usr/local/bin/wkhtmltoimage 2>/dev/null || true && \
    rm -rf /tmp/* && \
    /usr/local/bin/wkhtmltopdf --version
