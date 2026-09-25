# ---------- Stage 1: build ----------
# The maven image already ships a bundled Maven CLI; we use `mvn` directly
# (the checked-in Maven wrapper embeds a Windows-aware MAVEN_CONFIG reference
# that is not portable into this Linux image).
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Dependency metadata first (leverages Docker layer cache)
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Source + package
COPY src src
RUN mvn -B -q -DskipTests package

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# curl is used by the Docker healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -u 1001 appuser

COPY --from=builder /build/target/innovasphere-backend-0.1.0-SNAPSHOT.jar app.jar

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://localhost:8080/api/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]