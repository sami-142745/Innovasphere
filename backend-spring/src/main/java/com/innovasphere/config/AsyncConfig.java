package com.innovasphere.config;

import java.lang.reflect.Method;
import java.util.concurrent.ThreadPoolExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Executor backing the {@code @Async} methods (the adjacent-page prefetcher).
 *
 * <p>The pool is declared as a single {@code taskExecutor} bean, which
 * {@code @EnableAsync} adopts automatically. It is intentionally not produced by
 * {@link AsyncConfigurer#getAsyncExecutor()}, because that method is consulted on
 * every async invocation and a naive implementation tends to build a fresh pool
 * each time.
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    @Bean(name = "taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("prefetch-");
        executor.setKeepAliveSeconds(60);
        // Prefetching is best effort: never block a request thread on a full queue.
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (Throwable ex, Method method, Object... params) ->
                log.warn("Async task {} failed: {}", method.getName(), ex.toString());
    }
}
