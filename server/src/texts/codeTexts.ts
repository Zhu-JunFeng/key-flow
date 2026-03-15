export interface CodeTextPassage {
  readonly id: string;
  readonly text: string;
  readonly language: string;
  readonly title: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
}

const codeTexts: readonly CodeTextPassage[] = [
  // JavaScript
  {
    id: 'js-1',
    text: 'const greeting = (name) => {\n  return `Hello, ${name}!`;\n};',
    language: 'javascript',
    title: 'Arrow Function',
    difficulty: 'easy',
  },
  {
    id: 'js-2',
    text: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}',
    language: 'javascript',
    title: 'Fibonacci',
    difficulty: 'easy',
  },
  {
    id: 'js-3',
    text: 'const debounce = (fn, delay) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};',
    language: 'javascript',
    title: 'Debounce',
    difficulty: 'medium',
  },
  {
    id: 'js-4',
    text: 'async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error("Failed");\n    return await response.json();\n  } catch (error) {\n    console.error(error.message);\n    return null;\n  }\n}',
    language: 'javascript',
    title: 'Async Fetch',
    difficulty: 'medium',
  },
  {
    id: 'js-5',
    text: 'const deepClone = (obj) => {\n  if (obj === null || typeof obj !== "object") return obj;\n  const clone = Array.isArray(obj) ? [] : {};\n  for (const key in obj) {\n    if (obj.hasOwnProperty(key)) {\n      clone[key] = deepClone(obj[key]);\n    }\n  }\n  return clone;\n};',
    language: 'javascript',
    title: 'Deep Clone',
    difficulty: 'hard',
  },
  {
    id: 'js-6',
    text: 'class EventEmitter {\n  constructor() {\n    this.events = {};\n  }\n  on(event, callback) {\n    (this.events[event] ||= []).push(callback);\n  }\n  emit(event, ...args) {\n    (this.events[event] || []).forEach(cb => cb(...args));\n  }\n}',
    language: 'javascript',
    title: 'EventEmitter',
    difficulty: 'hard',
  },
  {
    id: 'js-7',
    text: 'const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);',
    language: 'javascript',
    title: 'Pipe Function',
    difficulty: 'easy',
  },
  {
    id: 'js-8',
    text: 'const memoize = (fn) => {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n};',
    language: 'javascript',
    title: 'Memoize',
    difficulty: 'medium',
  },
  {
    id: 'js-9',
    text: 'function* range(start, end, step = 1) {\n  for (let i = start; i < end; i += step) {\n    yield i;\n  }\n}',
    language: 'javascript',
    title: 'Generator Range',
    difficulty: 'medium',
  },
  {
    id: 'js-10',
    text: 'const throttle = (fn, limit) => {\n  let inThrottle = false;\n  return (...args) => {\n    if (!inThrottle) {\n      fn(...args);\n      inThrottle = true;\n      setTimeout(() => (inThrottle = false), limit);\n    }\n  };\n};',
    language: 'javascript',
    title: 'Throttle',
    difficulty: 'medium',
  },
  // Python
  {
    id: 'py-1',
    text: 'def greet(name: str) -> str:\n    return f"Hello, {name}!"',
    language: 'python',
    title: 'Greeting Function',
    difficulty: 'easy',
  },
  {
    id: 'py-2',
    text: 'def is_palindrome(s: str) -> bool:\n    cleaned = s.lower().replace(" ", "")\n    return cleaned == cleaned[::-1]',
    language: 'python',
    title: 'Palindrome Check',
    difficulty: 'easy',
  },
  {
    id: 'py-3',
    text: 'def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1',
    language: 'python',
    title: 'Binary Search',
    difficulty: 'medium',
  },
  {
    id: 'py-4',
    text: 'from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fib(n: int) -> int:\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)',
    language: 'python',
    title: 'Cached Fibonacci',
    difficulty: 'medium',
  },
  {
    id: 'py-5',
    text: 'class Stack:\n    def __init__(self):\n        self._items = []\n\n    def push(self, item):\n        self._items.append(item)\n\n    def pop(self):\n        if not self._items:\n            raise IndexError("Stack is empty")\n        return self._items.pop()\n\n    def peek(self):\n        return self._items[-1] if self._items else None',
    language: 'python',
    title: 'Stack Class',
    difficulty: 'medium',
  },
  {
    id: 'py-6',
    text: 'def merge_sort(arr: list) -> list:\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\n\ndef merge(left, right):\n    result = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    return result + left[i:] + right[j:]',
    language: 'python',
    title: 'Merge Sort',
    difficulty: 'hard',
  },
  {
    id: 'py-7',
    text: 'def flatten(lst):\n    for item in lst:\n        if isinstance(item, list):\n            yield from flatten(item)\n        else:\n            yield item',
    language: 'python',
    title: 'Flatten Generator',
    difficulty: 'easy',
  },
  {
    id: 'py-8',
    text: 'from collections import Counter\n\ndef most_common_words(text: str, n: int = 5):\n    words = text.lower().split()\n    return Counter(words).most_common(n)',
    language: 'python',
    title: 'Word Counter',
    difficulty: 'easy',
  },
  {
    id: 'py-9',
    text: 'def decorator(func):\n    def wrapper(*args, **kwargs):\n        print(f"Calling {func.__name__}")\n        result = func(*args, **kwargs)\n        print(f"Done: {result}")\n        return result\n    return wrapper',
    language: 'python',
    title: 'Decorator',
    difficulty: 'medium',
  },
  {
    id: 'py-10',
    text: 'async def fetch_all(urls: list[str]):\n    import aiohttp\n    async with aiohttp.ClientSession() as session:\n        tasks = [session.get(url) for url in urls]\n        responses = await asyncio.gather(*tasks)\n        return [await r.json() for r in responses]',
    language: 'python',
    title: 'Async Fetch All',
    difficulty: 'hard',
  },
  // Go
  {
    id: 'go-1',
    text: 'func main() {\n\tfmt.Println("Hello, World!")\n}',
    language: 'go',
    title: 'Hello World',
    difficulty: 'easy',
  },
  {
    id: 'go-2',
    text: 'func reverse(s string) string {\n\trunes := []rune(s)\n\tfor i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n\t\trunes[i], runes[j] = runes[j], runes[i]\n\t}\n\treturn string(runes)\n}',
    language: 'go',
    title: 'Reverse String',
    difficulty: 'easy',
  },
  {
    id: 'go-3',
    text: 'func binarySearch(arr []int, target int) int {\n\tleft, right := 0, len(arr)-1\n\tfor left <= right {\n\t\tmid := (left + right) / 2\n\t\tif arr[mid] == target {\n\t\t\treturn mid\n\t\t} else if arr[mid] < target {\n\t\t\tleft = mid + 1\n\t\t} else {\n\t\t\tright = mid - 1\n\t\t}\n\t}\n\treturn -1\n}',
    language: 'go',
    title: 'Binary Search',
    difficulty: 'medium',
  },
  {
    id: 'go-4',
    text: 'type Stack[T any] struct {\n\titems []T\n}\n\nfunc (s *Stack[T]) Push(item T) {\n\ts.items = append(s.items, item)\n}\n\nfunc (s *Stack[T]) Pop() (T, bool) {\n\tif len(s.items) == 0 {\n\t\tvar zero T\n\t\treturn zero, false\n\t}\n\titem := s.items[len(s.items)-1]\n\ts.items = s.items[:len(s.items)-1]\n\treturn item, true\n}',
    language: 'go',
    title: 'Generic Stack',
    difficulty: 'medium',
  },
  {
    id: 'go-5',
    text: 'func worker(id int, jobs <-chan int, results chan<- int) {\n\tfor j := range jobs {\n\t\tfmt.Printf("Worker %d processing job %d\\n", id, j)\n\t\tresults <- j * 2\n\t}\n}',
    language: 'go',
    title: 'Worker Goroutine',
    difficulty: 'medium',
  },
  {
    id: 'go-6',
    text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {\n\tif r.Method != http.MethodGet {\n\t\thttp.Error(w, "Method not allowed", http.StatusMethodNotAllowed)\n\t\treturn\n\t}\n\tw.Header().Set("Content-Type", "application/json")\n\tjson.NewEncoder(w).Encode(map[string]string{"status": "ok"})\n}',
    language: 'go',
    title: 'HTTP Handler',
    difficulty: 'medium',
  },
  {
    id: 'go-7',
    text: 'func fibonacci(n int) int {\n\tif n <= 1 {\n\t\treturn n\n\t}\n\ta, b := 0, 1\n\tfor i := 2; i <= n; i++ {\n\t\ta, b = b, a+b\n\t}\n\treturn b\n}',
    language: 'go',
    title: 'Fibonacci',
    difficulty: 'easy',
  },
  {
    id: 'go-8',
    text: 'func mergeSort(arr []int) []int {\n\tif len(arr) <= 1 {\n\t\treturn arr\n\t}\n\tmid := len(arr) / 2\n\tleft := mergeSort(arr[:mid])\n\tright := mergeSort(arr[mid:])\n\treturn merge(left, right)\n}',
    language: 'go',
    title: 'Merge Sort',
    difficulty: 'hard',
  },
  {
    id: 'go-9',
    text: 'type Cache struct {\n\tmu    sync.RWMutex\n\tstore map[string]interface{}\n}\n\nfunc (c *Cache) Get(key string) (interface{}, bool) {\n\tc.mu.RLock()\n\tdefer c.mu.RUnlock()\n\tv, ok := c.store[key]\n\treturn v, ok\n}\n\nfunc (c *Cache) Set(key string, value interface{}) {\n\tc.mu.Lock()\n\tdefer c.mu.Unlock()\n\tc.store[key] = value\n}',
    language: 'go',
    title: 'Thread-Safe Cache',
    difficulty: 'hard',
  },
  {
    id: 'go-10',
    text: 'func isPrime(n int) bool {\n\tif n < 2 {\n\t\treturn false\n\t}\n\tfor i := 2; i*i <= n; i++ {\n\t\tif n%i == 0 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}',
    language: 'go',
    title: 'Prime Check',
    difficulty: 'easy',
  },
];

export function getCodeTexts(language?: string): readonly CodeTextPassage[] {
  if (language) {
    return codeTexts.filter(t => t.language === language);
  }
  return codeTexts;
}

export { codeTexts as CODE_TEXTS };
